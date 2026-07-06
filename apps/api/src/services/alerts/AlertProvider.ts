export interface AlertData {
  incident: any;
  monitor: any;
  type: "creation" | "resolution" | "emergency";
  durationText?: string;
}

export interface AlertProvider {
  sendAlert(channelConfig: any, data: AlertData): Promise<void>;
}
