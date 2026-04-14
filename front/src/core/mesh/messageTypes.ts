export type MeshMessage =
  | {
      type: "SOS";
      userId: string;
      timestamp: number;
    }
  | {
      type: "REPORT";
      reportId: string;
      description: string;
      status: "pending" | "resolved";
    }
  | {
      type: "ALERT";
      message: string;
      severity: "low" | "high";
    };
