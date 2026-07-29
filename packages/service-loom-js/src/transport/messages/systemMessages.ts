export type SystemMessagesMap = {
  'handshake.init': {
    version: number;
    supportVersion: number;
  };
  'handshake.reply': {
    minVersion: string;
  };
  'handshake.complete': {
    success: boolean;
  };
};
