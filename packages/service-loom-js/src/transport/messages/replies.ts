export type ReplyErrorCode = 'unknown' | 'module not found' | 'service not found';

export type ReplyMap = {
  'actions.invoke': {
    actions: string;
  };
};
