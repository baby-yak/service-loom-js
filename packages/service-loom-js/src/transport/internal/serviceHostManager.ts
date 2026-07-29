import type { Service } from '../../services/service.js';
import { errorToString } from '../../utils/utils.js';
import type { ServiceHost } from '../serviceHost.js';
import type { Message, MessageCommand } from './messages.js';

/**
 * -- actions
 * service <- on "invoke" : action + reply
 *
 * -- state
 * service <- on "register-state"   : + select-path + send initial if needed
 * service <- on "unregister-state" : + select-path
 * service -> broadcast state/partial-state
 *
 * -- events
 * service <- "register-event"   : + name
 * service <- "unregister-event" : + name *
 * service -> broadcast event
 *
 */

export class ServiceHostManager<TClient> {
  private service: Service<any> | undefined;
  private serviceId: string;

  readonly host: ServiceHost<TClient>;

  constructor(service: Service<any>, serviceId: string, host: ServiceHost<TClient>) {
    this.service = service;
    this.serviceId = serviceId;
    this.host = host;

    host.on('data', async (client, data) => {
      const { serviceId, command } = data as Message;

      if (serviceId !== this.serviceId) {
        return;
      }

      switch (command.verb) {
        case 'actions-invoke': {
          const { action, args, token } = command;
          await this.action_invoke(client, token, action, args);
          break;
        }
        case 'state-register': {
          break;
        }
        case 'state-unregister': {
          break;
        }
        case 'events-register': {
          break;
        }
        case 'events-unregister': {
          break;
        }
      }
    });
    // -- actions:

    // state:

    service.state.subscribe((s) => {
      //send to all registered clients
      //   this.host.send(client, {});
    });

    service.events.on('*', (...args: any) => {
      //send to all registered clients
      //   this.host.send(client, {});
    });
  }

  disconnect() {
    if (!this.service) {
      return;
    }

    this.service = undefined;
  }

  async action_invoke(client: TClient, token: string, action: string, args: unknown[]) {
    if (!this.service) {
      return;
    }

    const fn = this.service.actions.invoke[action] as ((...args: any[]) => any) | undefined;
    if (!fn) {
      this.send(client, {
        verb: 'actions-result',
        token: token,
        status: 'error',
        data: `action not found : ${action}}`,
      });
      return;
    }

    try {
      const res = (await fn(...args)) as unknown;
      this.send(client, {
        verb: 'actions-result',
        token: token,
        status: 'success',
        data: res,
      });
    } catch (err: unknown) {
      this.send(client, {
        verb: 'actions-result',
        token: token,
        status: 'error',
        data: `action failed: ${errorToString(err)}`,
      });
    }
  }

  //-------------------------------------------------------
  //-- helpers
  //-------------------------------------------------------
  private send(client: TClient, command: MessageCommand) {
    const message: Message = {
      serviceId: this.serviceId,
      command,
    };
    this.host.send(client, message);
  }
}
