export type ActionStatus = 'success' | 'error';
export type SelectPathPart =
  | {
      what: 'prop';
      name: string;
    }
  | {
      what: 'index';
      idx: number;
    };

export type Message = {
  serviceId: string;
  command: MessageCommand;
};

export type MessageCommand =
  | //-- actions
  {
      verb: 'actions-invoke';
      token: string;
      action: string;
      args: unknown[];
    }
  | {
      verb: 'actions-result';
      token: string;
      status: ActionStatus;
      data: unknown;
    }
  //-- state
  | {
      verb: 'state-register';
      selectPath: SelectPathPart[];
    }
  | {
      verb: 'state-unregister';
      selectPath: SelectPathPart[];
    }
  | {
      verb: 'state-get';
      selectPath: SelectPathPart[];
    }
  | {
      verb: 'state-change';
      data: object;
    }
  | {
      verb: 'state-snapshot';
      data: object;
    }
  //-- events
  | {
      verb: 'events-register';
      event: string;
    }
  | {
      verb: 'events-unregister';
      event: string;
    }
  | {
      verb: 'events-emit';
      event: string;
      args: unknown[];
    };

// actions:
