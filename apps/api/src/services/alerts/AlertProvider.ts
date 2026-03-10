export interface AlertData {
  incident: any;
  monitor: any;
  type: 'creation' | 'resolution';
}

export interface AlertProvider {
  sendAlert(channelConfig: any, data: AlertData): Promise<void>;
}
