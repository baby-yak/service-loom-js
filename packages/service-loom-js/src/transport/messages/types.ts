import type { ReplyErrorCode, ReplyMap } from './replies.js';
import type { RequestMap } from './requests.js';
import type { SystemMessagesMap } from './systemMessages.js';

//-------------------------------------------------------
//-- MESSAGE
//-------------------------------------------------------

export type Message = SystemMessage | RequestMessage | ReplyMessage;

export type SystemMessage = {
  id: string;
  kind: 'system';
} & TakeFromMap<SystemMessagesMap, 'verb', 'data'>;

export type RequestMessage = {
  id: string;
  kind: 'request';
  service: string;
  module: string;
} & TakeFromMap<RequestMap, 'verb', 'data'>;

export type ReplyMessage = ReplySuccess | ReplyError;

export type ReplySuccess = {
  id: string;
  kind: 'reply';
  to: string;
  status: 'success';
} & TakeFromMap<ReplyMap, 'verb', 'data'>;

export type ReplyError = {
  id: string;
  kind: 'reply';
  to: string;
  status: 'error';

  errorCode: ReplyErrorCode;
  errorMessage: string;
  error: unknown;
};

//-------------------------------------------------------
//--
//-------------------------------------------------------
type TakeFromMap<
  MAP,
  FIELD_KEY extends string | undefined = undefined,
  FIELD_VALUE extends string | undefined = undefined,
> = {
  [K in keyof MAP]: (FIELD_KEY extends string
    ? //direct
      { [key in FIELD_KEY]: K }
    : //under [FIELD_KEY]
      MAP[K]) &
    (FIELD_VALUE extends string
      ? //direct
        { [key in FIELD_VALUE]: MAP[K] }
      : //under [FIELD_VALUE]
        MAP[K]);
}[keyof MAP];
