# Privacy Policy for Quest

**Last Updated**: October 27, 2025

## Introduction

Quest ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how Quest, a browser extension for saving and organizing web articles, handles your information.

## Our Privacy Commitment

**Quest does NOT collect, transmit, or sell any of your personal data.** All data is stored locally on your device. We have no servers, no databases, and no way to access your information.

## Data Storage

### What Data is Stored Locally

Quest stores the following information **locally on your device only**:

1. **Saved Articles**:
   - Article URLs, titles, and content
   - Reading time estimates
   - Timestamps (date saved, last accessed, date read)
   - Your organization preferences (categories, tags, pins, archive status)

2. **Extension Settings**:
   - Theme preference (light/dark mode)
   - Default category selection
   - Auto-archive settings
   - Reminder preferences
   - AI provider preferences (provider selection and model choices)

3. **Categories and Tags**:
   - Custom categories you create with names and colors
   - Tags you add to articles
   - Usage statistics for tags

4. **AI-Generated Content** (if you use AI features):
   - AI summaries generated from your articles
   - Audio files (podcasts) generated from summaries
   - Usage statistics (token counts, estimated costs)
   - Audit logs of AI operations

5. **Encrypted API Keys** (if you configure AI features):
   - Your API keys for OpenAI, Google Gemini, or ElevenLabs
   - Stored encrypted using AES-256-GCM encryption
   - Never transmitted to Quest servers (we don't have any)
   - Only used for direct API calls to the respective AI providers

### Where is Data Stored

- **IndexedDB**: All articles, summaries, audio files, categories, and tags
- **Chrome Storage (Local)**: Extension settings and encrypted API keys
- **Chrome Storage (Sync)**: Only basic settings (theme, preferences) if you enable Chrome Sync

**Important**: Chrome Sync is a browser feature. If enabled in your browser settings, some Quest settings may sync across your Chrome installations. Articles and API keys **never sync** and always stay on the local device.

## Data We Do NOT Collect

Quest does **NOT** collect, access, transmit, or store:

- ❌ Personal information (name, email, phone number, address)
- ❌ Financial information (credit cards, payment data)
- ❌ Health information
- ❌ Authentication credentials (passwords, login information)
- ❌ Browsing history beyond articles you explicitly save
- ❌ Location data
- ❌ Personally identifiable information of any kind
- ❌ Usage analytics or telemetry
- ❌ Cookies or tracking data

## How Quest Uses Your Data

Since all data is stored locally:

1. **Article Management**: Your saved articles and organization (categories, tags) are used only to display your library in the extension
2. **Search and Filtering**: Article content is indexed locally for fast search
3. **AI Features** (optional): If you configure AI providers:
   - Article content is sent directly to your chosen AI provider (OpenAI, Google, or ElevenLabs)
   - Responses are stored locally
   - Quest does not see, intercept, or store these API communications
4. **Settings**: Your preferences control how the extension behaves

## Third-Party Services (Optional AI Features)

If you choose to use AI features, Quest facilitates direct communication between your browser and third-party AI providers:

### OpenAI
- **Data Sent**: Article text for summary generation
- **Their Privacy Policy**: https://openai.com/policies/privacy-policy
- **Your Control**: You provide the API key; you can revoke it anytime

### Google Gemini
- **Data Sent**: Article text for summaries or audio generation
- **Their Privacy Policy**: https://policies.google.com/privacy
- **Your Control**: You provide the API key; you can revoke it anytime

### ElevenLabs
- **Data Sent**: Summary text for audio generation
- **Their Privacy Policy**: https://elevenlabs.io/privacy
- **Your Control**: You provide the API key; you can revoke it anytime

**Important**: Quest acts only as a facilitator. We do not intercept, store, or process these communications. Your data goes directly from your browser to the AI provider using your API key.

## Data Sharing

**Quest does NOT share your data with anyone.** 

- We have no servers to store data
- We have no analytics to track usage
- We have no third-party integrations (except optional AI providers you explicitly configure)
- Your data never leaves your device except when:
  - You export it yourself
  - You use AI features (direct to AI provider, not through us)

## Your Data Rights

You have complete control over your data:

1. **Access**: All your data is accessible in the extension at any time
2. **Export**: Full data export feature available in Manager → Export/Import
3. **Delete**: 
   - Delete individual articles anytime
   - Clear all data in Settings → Data Management
   - Uninstall the extension to remove all local data
4. **Modify**: Edit, organize, or update any saved content
5. **Portability**: Export your data in JSON format to use elsewhere

## Data Retention

- Data is retained **locally** until you delete it
- No automatic data expiration (you control everything)
- Auto-archive feature (optional) moves read articles to archive but doesn't delete them
- Uninstalling the extension removes all local data from your device

## Security

Quest takes security seriously:

1. **Local Storage**: All data stored in browser's secure IndexedDB and Chrome Storage
2. **API Key Encryption**: AI API keys encrypted with AES-256-GCM using Web Crypto API
3. **No Network Transmission**: No data sent to Quest servers (we don't have any)
4. **Minimal Permissions**: Only requests necessary browser permissions
5. **Open Source**: Code is auditable on GitHub - verify our claims yourself

## Children's Privacy

Quest does not knowingly collect data from anyone, including children. Since all data is local and we don't collect information, Quest can be used by anyone. However, AI features require API keys which typically require users to be 18+.

## Changes to Privacy Policy

We may update this Privacy Policy to reflect changes in the extension. Updates will be posted:
- In this document with a new "Last Updated" date
- In the extension's release notes on GitHub
- On the Chrome Web Store listing

Continued use after changes indicates acceptance of the updated policy.

## Compliance

Quest complies with:
- Chrome Web Store Developer Program Policies
- General Data Protection Regulation (GDPR)
- California Consumer Privacy Act (CCPA)
- Other applicable privacy laws

## Data Collection Summary

For Chrome Web Store compliance, we certify:

**User Data Collected**: NONE

Quest does not collect any of the following:
- ❌ Personally identifiable information
- ❌ Health information  
- ❌ Financial and payment information
- ❌ Authentication information
- ❌ Personal communications
- ❌ Location data
- ❌ Web history (beyond articles you save)
- ❌ User activity tracking
- ❌ Website content (beyond articles you explicitly save)

**Data Storage**: All data is stored locally on the user's device. No cloud storage, no servers.

**Data Sharing**: None. We do not sell, transfer, or share user data with third parties.

**Third-Party Services**: If users configure optional AI features, they establish direct connections to AI providers (OpenAI, Google, ElevenLabs) using their own API keys. Quest facilitates these connections but does not intercept or process the data.

## Contact Information

Quest is an open-source project maintained on GitHub.

- **GitHub Repository**: https://github.com/hendurhance/quest
- **Issues & Questions**: https://github.com/hendurhance/quest/issues
- **Discussions**: https://github.com/hendurhance/quest/discussions

For privacy concerns or questions, please open an issue on GitHub.

## Open Source

Quest is licensed under GNU GPL v3.0. The complete source code is available at:
https://github.com/hendurhance/quest

You can verify all privacy claims by auditing the code yourself.

---

## Summary

**Quest's Privacy Promise:**

✅ All data stored locally on your device  
✅ No tracking, analytics, or telemetry  
✅ No accounts or registration required  
✅ No data collection or transmission to Quest  
✅ You control all your data  
✅ Open source and auditable  
✅ Encrypted API keys if you use AI features  
✅ Full data export capability  

**What We Don't Do:**

❌ No cloud storage or servers  
❌ No user tracking  
❌ No data selling or sharing  
❌ No hidden data collection  
❌ No third-party analytics  
❌ No advertising networks  

Your privacy is not negotiable. That's the Quest promise.

---

*This privacy policy is effective as of October 27, 2025.*
