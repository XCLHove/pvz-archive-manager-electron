import definePreloadAction from './utils/definePreloadAction.ts'

const actions = import.meta.glob(['./preload-actions/*.ts'], {
  eager: true,
  import: 'default',
})
Object.entries(actions).forEach(([_, _doAction]) => {
  const doAction = _doAction as ReturnType<typeof definePreloadAction>
  doAction()
})
