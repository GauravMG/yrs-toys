export function emailLayout(bodyHtml: string): string {
  return `
  <div style="background:#FBF7EF;padding:32px 16px;font-family:Georgia,'Times New Roman',serif;color:#2E2A24;">
    <div style="max-width:520px;margin:0 auto;background:#FFFFFF;border:1px solid #E7DFCC;border-radius:14px;overflow:hidden;">
      <div style="background:#2E2A24;color:#F1E9D8;text-align:center;padding:22px 24px;">
        <div style="font-size:22px;letter-spacing:.12em;font-weight:600;">YRS</div>
        <div style="font-size:10px;letter-spacing:.5em;opacity:.85;margin-top:2px;">TOYS</div>
      </div>
      <div style="padding:32px 30px;font-family:Helvetica,Arial,sans-serif;font-size:14.5px;line-height:1.7;color:#2E2A24;">
        ${bodyHtml}
      </div>
      <div style="text-align:center;padding:18px;font-family:Helvetica,Arial,sans-serif;font-size:11.5px;color:#5C574C;border-top:1px solid #E7DFCC;">
        &copy; ${new Date().getFullYear()} YRS Toys &middot; Crafted with care for curious little hands.
      </div>
    </div>
  </div>`;
}

export function emailButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#C08A3E;color:#ffffff;text-decoration:none;font-family:Helvetica,Arial,sans-serif;font-weight:bold;font-size:13px;letter-spacing:.05em;text-transform:uppercase;padding:13px 24px;border-radius:6px;margin-top:8px;">${label}</a>`;
}
