<script setup lang="ts">
import { ElButton, ElMessage, ElMessageBox, ElNotification, ElText } from 'element-plus'
import { h, onMounted, Ref, ref, watch } from 'vue'
import { useClipboard } from '@vueuse/core'
import avoidCloneError from '@renderer/utils/avoidCloneError.ts'
import { PvzVersionInfo } from '../types/PvzVersionInfo.ts'
import { Archive } from '../types/Archive.ts'

const clipboard = useClipboard()

onMounted(() => {
  const messageVNode = h('div', [
    h(ElText, { type: 'warning' }, () => '软件完全开源免费，使用本软件的功能前请关闭游戏，否则容易出现bug导致操作不生效。'),
    h('div', [
      h('span', '后续更新请关注作者动态：'),
      h(
        ElButton,
        {
          type: 'primary',
          link: true,
          onClick: () => {
            clipboard.copy('https://space.bilibili.com/388148652/dynamic').then(() => {
              ElMessage.success('已复制链接')
            })
          },
        },
        () => '点我复制链接',
      ),
    ]),
  ])

  ElNotification.warning({
    title: '注意',
    message: messageVNode,
    duration: 3000,
  })
})

const versionInfoList = ref<PvzVersionInfo[]>([])
const getVersionInfoList = () => {
  window.configApi.get().then((res: PvzVersionInfo[]) => {
    versionInfoList.value = res
  })
}
onMounted(getVersionInfoList)

const versionInfoMap = new Map<string, PvzVersionInfo>()
watch(versionInfoList, () => {
  versionInfoList.value.forEach((versionInfo) => {
    versionInfoMap.set(versionInfo.name, versionInfo)
  })
})

const selectVersionName = ref() as Ref<string>
watch(versionInfoList, () => {
  versionInfoList.value.forEach((versionInfo, index) => {
    if (index !== 0) return
    if (!versionInfoMap.has(selectVersionName.value)) {
      selectVersionName.value = versionInfo.name
    }
  })
})

const selectVersionInfo = ref() as Ref<PvzVersionInfo>
watch(selectVersionName, () => {
  selectVersionInfo.value = versionInfoMap.get(selectVersionName.value) as PvzVersionInfo
})

const currentVersionArchiveList = ref<Archive[]>([])
const getCurrentVersionArchiveList = async () => {
  if (!selectVersionInfo.value) return
  await window.archiveApi.list(avoidCloneError(selectVersionInfo.value)).then((res: Archive[]) => {
    currentVersionArchiveList.value = res
  })
}
watch(() => selectVersionInfo.value, getCurrentVersionArchiveList)

const updateVersionInfo = async (versionInfo: PvzVersionInfo) => {
  console.log(JSON.stringify(versionInfo))
  versionInfoMap.set(versionInfo.name, versionInfo)
  const newVersionInfoList: PvzVersionInfo[] = [...versionInfoMap.values()]
  await window.configApi.set(avoidCloneError(newVersionInfoList))
}

const formatDate = (date: Date, asFileName?: boolean) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()
  const result = `${year}-${month}-${day} ${`${hour}`.padStart(2, '0')}:${`${minute}`.padStart(2, '0')}:${`${second}`.padStart(2, '0')}`
  if (asFileName) {
    return result.replace(/:/g, '-')
  }
  return result
}

const doCreateArchive = async (archiveName: string) => {
  await window.archiveApi.create(avoidCloneError(selectVersionInfo.value), archiveName)
  await getCurrentVersionArchiveList()
  await updateVersionInfo({ ...selectVersionInfo.value, currentArchive: archiveName }).then(() => {
    selectVersionInfo.value.currentArchive = archiveName
  })
}

const createArchive = () => {
  ElMessageBox.prompt('使用当前游戏进度创建存档', '创建存档', {
    inputPlaceholder: '请输入存档名称',
    inputType: 'text',
    inputPattern: /^[^\\/:*?"<>|]+$/,
    inputErrorMessage: '名称不能包含以下字符：\\ / : * ? " < > |',
    inputValue: selectVersionInfo.value?.currentArchive || '',
  })
    .then(({ value: archiveName }) => {
      doCreateArchive(archiveName).then(() => {
        ElMessage.success('创建成功')
      })
    })
    .catch(() => {})
}

const overwriteArchive = (archive: Archive) => {
  ElMessageBox.confirm(`确认使用当前游戏进度<${selectVersionInfo.value.currentArchive || '未知'}>覆盖存档<${archive.name}>?`, '覆盖存档', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
  })
    .then(() => {
      doCreateArchive(archive.name).then(() => {
        ElMessage.success(`已使用当前游戏进度覆盖存档<${archive.name}>`)
      })
    })
    .catch(() => {})
}

const doRemoveArchive = async (archive: Archive) => {
  await window.archiveApi.remove(avoidCloneError(selectVersionInfo.value), avoidCloneError(archive)).then(() => {
    getCurrentVersionArchiveList()
  })
}

const removeArchive = (archive: Archive) => {
  ElMessageBox.confirm(`确认删除存档<${archive.name}>?`, '删除存档', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
  })
    .then(() => {
      doRemoveArchive(archive).then(() => {
        ElMessage.success('删除成功')
      })
    })
    .catch(() => {})
}

const backupCurrentGameProgress = async () => {
  const now = new Date()
  const archiveName = `备份_${formatDate(now, true)}`

  await doCreateArchive(archiveName).then(() => {
    ElMessage.success('备份成功')
    updateVersionInfo({ ...selectVersionInfo.value, currentArchive: archiveName }).then(() => {
      selectVersionInfo.value.currentArchive = archiveName
    })
  })
}

const clearCurrentGameProgress = () => {
  ElMessageBox.confirm('确认清空当前游戏进度？', '清空进度', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
  })
    .then(() => backupCurrentGameProgress())
    .then(() =>
      window.archiveApi.reset(avoidCloneError(selectVersionInfo.value)).then(() => {
        ElMessage.success('清空成功')
      }),
    )
    .then(() => {
      selectVersionInfo.value.currentArchive = undefined
      return updateVersionInfo(selectVersionInfo.value)
    })
    .catch(() => {})
}

const doUseArchive = async (archive: Archive) => {
  const now = new Date()
  const archiveName = selectVersionInfo.value.currentArchive || `未命名_${formatDate(now, true)}`
  await doCreateArchive(archiveName)
    .then(() => {
      ElMessage.success(`同步游戏进度至存档<${archiveName}>`)
    })
    .catch(() => {})
  await window.archiveApi.use(avoidCloneError(selectVersionInfo.value), avoidCloneError(archive)).then(() => {
    ElMessage.success(`已切换至存档<${archive.name}>`)
  })
  await updateVersionInfo({ ...selectVersionInfo.value, currentArchive: archive.name }).then(() => {
    selectVersionInfo.value.currentArchive = archive.name
  })
}

const useArchive = (archive: Archive) => {
  ElMessageBox.confirm(`确认使用存档<${archive.name}>覆盖当前游戏进度?`, '切换存档', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
  })
    .then(() => doUseArchive(archive))
    .catch(() => {})
}
</script>

<template>
  <div>
    <div class="operation">
      <el-select v-model="selectVersionName">
        <el-option v-for="versionInfo in versionInfoList" :key="versionInfo.name" :label="versionInfo.name" :value="versionInfo.name" />
      </el-select>
      <el-button type="primary" @click="createArchive">使用当前游戏进度创建存档</el-button>
      <el-button type="danger" @click="clearCurrentGameProgress">清空当前游戏进度（自动备份）</el-button>
    </div>
    <div class="info">
      <el-text type="danger"
        >当前存档：
        <el-tag type="danger">
          {{ selectVersionInfo?.currentArchive || '未知' }}
        </el-tag>
      </el-text>
    </div>
    <el-table :data="currentVersionArchiveList" empty-text="暂无存档" height="450">
      <el-table-column prop="name" label="存档名称" />
      <el-table-column prop="createTime" label="创建时间">
        <template #default="{ row: archive }: { row: Archive }">
          {{ formatDate(archive.createTime) }}
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="操作" width="240" align="center">
        <template #default="{ row: archive }: { row: Archive }">
          <span v-if="archive.name !== selectVersionInfo.currentArchive">
            <el-tooltip :content="`删除存档<${archive.name}>`">
              <el-button type="danger" @click="removeArchive(archive)">删除</el-button>
            </el-tooltip>
            <el-tooltip :content="`使用当前游戏进度<${selectVersionInfo.currentArchive}>覆盖存档<${archive.name}>`">
              <el-button type="warning" @click="overwriteArchive(archive)">覆盖</el-button>
            </el-tooltip>
            <el-tooltip :content="`将当前游戏进度覆盖存档<${selectVersionInfo.currentArchive}>并切换至存档<${archive.name}>`">
              <el-button type="primary" @click="useArchive(archive)">{{ archive.name === selectVersionInfo.currentArchive ? '当前' : '切换' }}</el-button>
            </el-tooltip>
          </span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped lang="less">
.operation {
  display: flex;

  & > * {
    margin-right: 10px;

    &:last-child {
      margin-right: 0;
    }
  }
}

.info {
  margin: 10px 0;
}
</style>
