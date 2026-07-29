import { ServiceChannel } from '../../serviceChannel.js';
import { ServiceHost } from '../../serviceHost.js';
import { v4 as uuid } from 'uuid';

//-------------------------------------------------------
//--
//-------------------------------------------------------

export class PassThroughChannel extends ServiceChannel {
  readonly clientId: string;
  private onSend: (clientId: string, data: object) => void;
  private onConnect: () => void;
  private onClose: () => void;

  constructor(
    clientId: string,
    callbacks: {
      onSend: (clientId: string, data: object) => void;
      onConnect: () => void;
      onClose: () => void;
    },
  ) {
    super();
    this.clientId = clientId;
    this.onSend = callbacks.onSend;
    this.onConnect = callbacks.onConnect;
    this.onClose = callbacks.onClose;
  }

  connect(): Promise<void> | void {
    return this.onConnect();
  }
  close(): Promise<void> | void {
    return this.onClose();
  }
  send(data: object): void {
    return this.onSend(this.clientId, data);
  }
}

//-------------------------------------------------------
//--
//-------------------------------------------------------
export class PassThroughHost extends ServiceHost<string> {
  private onSend: (clientId: string, data: object) => void;
  private onConnect: () => void;
  private onClose: () => void;

  constructor(callbacks: {
    onSend: (clientId: string, data: object) => void;
    onConnect: () => void;
    onClose: () => void;
  }) {
    super();
    this.onSend = callbacks.onSend;
    this.onConnect = callbacks.onConnect;
    this.onClose = callbacks.onClose;
  }

  connect(): Promise<void> | void {
    return this.onConnect();
  }
  close(): Promise<void> | void {
    return this.onClose();
  }
  send(client: string, data: object): void {
    return this.onSend(client, data);
  }
}

//-------------------------------------------------------
//--
//-------------------------------------------------------
export class PassThrough {
  private clients = new Map<string, PassThroughChannel>();
  readonly host: PassThroughHost;
  constructor() {
    this.host = new PassThroughHost({
      onSend: (clientId, data) => {
        //find and send to client:
        const client = this.clients.get(clientId);
        if (!client) return;
        client.emit('data', data);
      },
      onConnect: () => {
        this.host.emit('connected');
      },
      onClose: () => {
        this.host.emit('disconnected', 'closed');
      },
    });
  }

  createChannel() {
    const cid = uuid();
    const client = new PassThroughChannel(cid, {
      onSend: (clientId, data) => {
        //channel-> host
        this.host.emit('data', clientId, data);
      },
      onConnect: () => {
        this.clients.set(cid, client);
        client.emit('connected');
        this.host.emit('clientConnected', cid);
      },
      onClose: () => {
        this.clients.delete(cid);
        client.emit('disconnected', 'closed');
        this.host.emit('clientDisconnected', cid);
      },
    });

    return client;
  }
}
