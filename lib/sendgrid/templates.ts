import 'server-only';
import { sendEmail } from './client';

export async function taskApprovalRequest(args: {
  to: string;
  parentName: string;
  childName: string;
  taskTitle: string;
  approvalUrl: string;
}) {
  await sendEmail({
    to: args.to,
    subject: `${args.childName} 完成咗一個任務,請批核`,
    html: `<p>Hi ${args.parentName},</p>
      <p><strong>${args.childName}</strong> 提交咗任務:<em>${args.taskTitle}</em></p>
      <p><a href="${args.approvalUrl}">批核 / 唔批核</a></p>
      <p>— CapyFinance 悠學豚</p>`,
  });
}

export async function weeklyReportReady(args: {
  to: string;
  parentName: string;
  childName: string;
  reportUrl: string;
}) {
  await sendEmail({
    to: args.to,
    subject: `${args.childName} 本週理財報告 出咗喇`,
    html: `<p>Hi ${args.parentName},</p>
      <p><strong>${args.childName}</strong> 本週嘅理財報告已經出咗,睇下啦!</p>
      <p><a href="${args.reportUrl}">查看報告</a></p>
      <p>— CapyFinance 悠學豚</p>`,
  });
}
