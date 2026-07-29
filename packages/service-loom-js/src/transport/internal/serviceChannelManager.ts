import { v4 as uuid } from 'uuid';
import type { RemoteService } from '../../services/remoteService.js';
import type { ServiceChannel } from '../serviceChannel.js';
import type { ActionStatus, Message, MessageCommand } from './messages.js';

type PendingInvocation = {
  invokedAt: number;
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
};

export class ServiceChannelManager {
  private service: RemoteService<any> | undefined;
  private serviceId: string;

  readonly channel: ServiceChannel;

  private pendingInvocations = new Map<string, PendingInvocation>();

  constructor(service: RemoteService<any>, serviceId: string, channel: ServiceChannel) {
    this.service = service;
    this.serviceId = serviceId;
    this.channel = channel;

    channel.on('data', (data) => {
      const { command, serviceId } = data as Message;

      if (serviceId !== this.serviceId) {
        return;
      }

      switch (command.verb) {
        case 'actions-result': {
          const { token, status, data } = command;
          this.action_result(token, status, data);
          break;
        }
        case 'state-change': {
          break;
        }
        case 'state-snapshot': {
          break;
        }
        case 'events-emit': {
          break;
        }
      }
    });

    //-- actions
    service.actions.setHandler('*', (action, ...args) => {
      //TODO: timeout for pending actions

      const token = uuid();

      //store as pending
      const invocation = new Promise((resolve, reject) => {
        this.pendingInvocations.set(token, {
          invokedAt: Date.now(),
          resolve,
          reject,
        });
      });

      //invoke remotely
      this.send({
        verb: 'actions-invoke',
        token,
        action,
        args,
      });

      return invocation;
    });
  }
  action_result(token: string, status: ActionStatus, data: unknown) {
    if (!this.service) {
      return;
    }

    //get pending invocation
    const pending = this.pendingInvocations.get(token);
    if (!pending) {
      return;
    }

    this.pendingInvocations.delete(token);

    if (status === 'error') {
      pending.reject(data);
      return;
    }
    pending.resolve(data);
  }

  disconnect() {
    if (!this.service) {
      return;
    }

    this.service = undefined;
  }

  //-------------------------------------------------------
  //-- helpers
  //-------------------------------------------------------
  private send(command: MessageCommand) {
    const message: Message = {
      serviceId: this.serviceId,
      command,
    };
    this.channel.send(message);
  }
}
