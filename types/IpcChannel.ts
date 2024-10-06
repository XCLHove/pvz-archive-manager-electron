enum IpcChannel {
  ARCHIVE_CREATE = 'archive:create',
  ARCHIVE_REMOVE = 'archive:remove',
  ARCHIVE_LIST = 'archive:list',
  ARCHIVE_USE = 'archive:use',
  ARCHIVE_UPDATE = 'archive:update',
  ARCHIVE_RESET = 'archive:reset',

  CONFIG_GET = 'config:get',
  CONFIG_SET = 'config:set',
}
export default IpcChannel
