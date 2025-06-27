# 🔒 Security Guide - Protecting API Keys

## ⚠️ CRITICAL: Never Commit API Keys to Git

This project had an Amadeus API key accidentally committed to GitHub, which resulted in the key being disabled. This guide prevents future incidents.

## 🛡️ Security Measures Implemented

### 1. **Enhanced .gitignore**
- All `.env*` files are ignored
- Patterns for `*key*`, `*secret*`, `*token*`, `*credential*` files
- Test files that might contain hardcoded credentials

### 2. **Pre-commit Hook**
- Automatically scans for potential API keys before commits
- Blocks commits containing suspicious patterns
- Can be bypassed with `git commit --no-verify` if needed

### 3. **Environment Variables Only**
All API keys must be stored in `.env` files:

```bash
# .env file (NEVER commit this)
AMADEUS_API_KEY=your_new_api_key
AMADEUS_API_SECRET=your_api_secret_here
RAPIDAPI_KEY=your_rapidapi_key_here
GOOGLE_PLACES_API_KEY=your_google_key_here
DEEPSEEK_API_KEY=your_deepseek_key_here
```

## 🚨 What Happened

1. **API Key Exposure**: Hardcoded Amadeus API key in `test-amadeus-simple.js`
2. **GitHub Detection**: Amadeus automatically detected the key in the public repository
3. **Key Disabled**: Amadeus disabled the compromised key for security
4. **History Cleaned**: Used BFG Repo-Cleaner to remove key from all git history

## ✅ How to Get New Amadeus API Key

1. **Log into Amadeus Developer Portal**: https://developers.amadeus.com/
2. **Go to "My Apps"** section
3. **Create New App** or regenerate keys for existing app
4. **Copy the new API Key and Secret**
5. **Add to .env file** (NOT in code files)

```bash
# Add these to your .env file
AMADEUS_API_KEY=your_new_api_key
AMADEUS_API_SECRET=your_new_api_secret
```

## 🔧 Best Practices

### ✅ DO:
- Store all secrets in `.env` files
- Use `process.env.API_KEY` in code
- Add `.env` to `.gitignore`
- Use different keys for development/production
- Rotate keys regularly
- Use environment-specific variable names

### ❌ DON'T:
- Hardcode API keys in source code
- Commit `.env` files
- Share API keys in chat/email
- Use production keys in development
- Ignore security warnings

## 🧪 Testing with API Keys

For test files, always use environment variables:

```javascript
// ✅ CORRECT
const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET

if (!AMADEUS_API_KEY || !AMADEUS_API_SECRET) {
  console.error('Missing API credentials in .env file')
  process.exit(1)
}
```

```javascript
// ❌ NEVER DO THIS
const AMADEUS_API_KEY = 'G7iETeTCtwnvzdJf9qXRuNwaa9FHAgwb' // EXPOSED!
```

## 🚑 Emergency Response

If you accidentally commit an API key:

1. **Immediately revoke/regenerate** the key in the provider's dashboard
2. **Remove from git history** using BFG Repo-Cleaner
3. **Force push** to update remote repository
4. **Update .env** with new credentials
5. **Review security practices**

## 📞 Support

If you need help with API key management or security concerns, refer to:
- [Amadeus Security Best Practices](https://developers.amadeus.com/security)
- [GitHub Security Advisories](https://docs.github.com/en/code-security)
- This project's security documentation

---

**Remember**: Security is everyone's responsibility. When in doubt, ask before committing! 🔐 