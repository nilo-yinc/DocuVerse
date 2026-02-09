import os
import smtplib
from email.message import EmailMessage
from pathlib import Path
from urllib.parse import quote


def _env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


def _load_smtp_config():
    host = _env("EMAIL_HOST")
    port = int(_env("EMAIL_PORT", "587") or "587")
    user = _env("EMAIL_USER")
    password = _env("EMAIL_PASS")
    sender = _env("SENDER_EMAIL") or user
    if not host or not user or not password or not sender:
        raise ValueError("SMTP configuration missing. Set EMAIL_HOST, EMAIL_USER, EMAIL_PASS, SENDER_EMAIL.")
    return host, port, user, password, sender


def _resolve_docx_path(document_link: str) -> Path | None:
    if not document_link:
        return None
    if document_link.startswith("/download_srs/"):
        filename = document_link.split("/download_srs/", 1)[1]
        local_path = Path("./backend/beta/generated_srs") / filename
        if local_path.exists():
            return local_path
    return None


def send_review_email(
    to_email: str,
    subject: str,
    body: str,
    reply_to: str | None = None,
    document_link: str | None = None,
    project_id: str | None = None,
    review_token: str | None = None
):
    host, port, user, password, sender = _load_smtp_config()

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to_email
    if reply_to:
        msg["Reply-To"] = reply_to

    msg.set_content(body)

    if project_id:
        base_url = _env("BASE_URL", "http://localhost:8000")
        token_q = f"&token={quote(review_token)}" if review_token else ""
        approve_url = f"{base_url.rstrip('/')}/api/workflow/review?projectId={quote(project_id)}&action=APPROVED{token_q}"
        reject_url = f"{base_url.rstrip('/')}/api/workflow/review?projectId={quote(project_id)}&action=REJECTED{token_q}"
        html = f"""
        <html>
          <body>
            <p>Hello,</p>
            <p>You have been invited to review the SRS for: <b>{subject.replace('DocuVerse Review: ', '')}</b></p>
            <p>Document link: <a href="{document_link}">{document_link}</a></p>
            <pre style="background:#f6f8fa;padding:12px;border-radius:8px;">{body}</pre>
            <p style="margin-top:16px;">
              <a href="{approve_url}" style="background:#16a34a;color:white;padding:10px 16px;border-radius:6px;text-decoration:none;margin-right:8px;">Approve</a>
              <a href="{reject_url}" style="background:#dc2626;color:white;padding:10px 16px;border-radius:6px;text-decoration:none;">Request Changes</a>
            </p>
            <p>If you need to reply, your reply will go to the sender.</p>
          </body>
        </html>
        """
        msg.add_alternative(html, subtype="html")

    doc_path = _resolve_docx_path(document_link or "")
    if doc_path:
        with open(doc_path, "rb") as f:
            data = f.read()
        msg.add_attachment(
            data,
            maintype="application",
            subtype="vnd.openxmlformats-officedocument.wordprocessingml.document",
            filename=doc_path.name
        )

    with smtplib.SMTP(host, port) as server:
        server.starttls()
        server.login(user, password)
        server.send_message(msg)
