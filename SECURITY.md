# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | :white_check_mark: |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in AutoSRS, please report it responsibly:

### 🔒 Private Reporting

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead:
1. Email: [Your contact email] or create a private security advisory
2. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **Initial Response:** Within 48 hours
- **Status Update:** Within 7 days
- **Fix Release:** Depends on severity (critical: 7 days, high: 14 days, medium: 30 days)

## Security Best Practices

### API Keys

- **Never commit** `.env` files with real API keys
- Use `.env.example` for templates only
- Rotate API keys regularly
- Use environment-specific keys (dev/prod)

### Deployment

- Keep dependencies updated: `pip list --outdated`
- Use HTTPS in production
- Implement rate limiting for public APIs
- Monitor API usage and costs

### Code Security

- Validate all user inputs
- Sanitize Mermaid diagram code before rendering
- Use latest versions of dependencies
- Review third-party packages for known vulnerabilities

## Known Security Considerations

1. **API Key Exposure:** Ensure `.env` is in `.gitignore`
2. **Rate Limiting:** System includes retry logic - monitor for abuse
3. **Input Validation:** User inputs are processed by AI - validate before use
4. **File Generation:** Generated files are stored locally - implement cleanup

## Updates

Subscribe to repository releases to stay informed about security updates.

---

Thank you for helping keep AutoSRS secure! 🔐
