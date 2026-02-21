import * as nodemailer from "nodemailer";
import { env } from "@/env/server";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.MAIL_EMAIL,
    pass: env.MAIL_PASS,
  },
});
