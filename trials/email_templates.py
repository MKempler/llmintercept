"""Email templates for trial management."""
from datetime import datetime
from trials import TrialAccount


def welcome_email_template(account: TrialAccount, gateway_url: str) -> str:
    """Generate welcome email for trial account."""
    return f"""Subject: Your AI Prompt Firewall Trial Account

Hi there,

Thanks for your interest in AI Prompt Firewall! I've set up your 14-day free trial.

Here are your account details:

API Key: {account.api_key}
Gateway URL: {gateway_url}
Trial Expires: {account.expires_at.strftime('%B %d, %Y')}

Quick Start Guide:

1. Install the SDK:
   pip install aifirewall

2. Replace your OpenAI client:
   from aifirewall import OpenAI
   
   client = OpenAI(
       api_key="your-openai-key",  # Their OpenAI key
       firewall_url="{gateway_url}"
   )

3. Use it like normal:
   response = client.chat.completions.create(
       model="gpt-3.5-turbo",
       messages=[{{"role": "user", "content": "Hello!"}}]
   )

That's it! Your requests are now automatically scanned and protected.

Dashboard: {gateway_url.replace('/v1', '')}/dashboard
(You can view violations and logs here)

I'll check in next week to see how it's going. In the meantime, let me know if you have any questions!

Best,
[Your Name]

P.S. The firewall works with your existing OpenAI API key - you don't need to change anything else.
"""


def follow_up_email_template(account: TrialAccount) -> str:
    """Generate follow-up email."""
    days_left = (account.expires_at - datetime.now()).days
    return f"""Subject: How's your AI Prompt Firewall trial going?

Hi,

Checking in - how's your trial going? You have {days_left} days left.

Have you been able to integrate it? Any questions or issues?

I'm here to help!

Best,
[Your Name]
"""


def conversion_email_template(account: TrialAccount) -> str:
    """Generate conversion email."""
    return f"""Subject: Ready to upgrade to paid?

Hi,

Great to hear you're getting value from AI Prompt Firewall!

Your trial expires on {account.expires_at.strftime('%B %d')}. Ready to upgrade?

Pro Plan: $99/month
- 50,000 prompts/month
- Advanced detection
- Email support
- All features

I can send you an invoice, or you can pay via Stripe: [link]

Let me know!

Best,
[Your Name]
"""

