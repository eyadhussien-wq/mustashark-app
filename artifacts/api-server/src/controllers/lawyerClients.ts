import { Request, Response } from "express";
import { listLawyerOwnedClients } from "../services/lawyerClientOwnership";

export type LawyerClientDirectoryItem = {
  id: string;
  name: string;
  email: string;
  country: string | null;
};

export const listMyClients = async (req: Request, res: Response) => {
  try {
    const lawyerId = req.authUser!.id;
    const clients = await listLawyerOwnedClients(lawyerId);
    return res.json({ ok: true, clients: clients satisfies LawyerClientDirectoryItem[] });
  } catch (error) {
    console.error("List My Clients Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};
