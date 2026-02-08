# AutoSRS Performance Benchmarks

## Generation Time Comparison

### Groq Models (Free Tier)

| Model | Execution Mode | Avg Time | Success Rate | Notes |
|-------|---------------|----------|--------------|-------|
| llama-4-scout-17b | Parallel | ❌ Fails | 0% | Rate limit exceeded |
| llama-3.3-70b | Parallel | ❌ Fails | 0% | Rate limit exceeded |
| llama-3.1-8b | Sequential | 6-8 min | 80% | Requires retries |
| mixtral-8x7b | Sequential | 5-7 min | 85% | Better rate limits |

### Gemini Models (Free Tier)

| Model | Execution Mode | Avg Time | Success Rate | Notes |
|-------|---------------|----------|--------------|-------|
| gemini-1.5-pro | Parallel | 30-90s | 99% | ⭐ Recommended |
| gemini-1.5-flash | Parallel | 20-60s | 99% | Fastest option |

### OpenAI Models (Paid)

| Model | Execution Mode | Avg Time | Cost per SRS | Notes |
|-------|---------------|----------|--------------|-------|
| gpt-4o-mini | Parallel | 30-60s | ~$0.10 | Best value |
| gpt-4o | Parallel | 45-90s | ~$0.50 | Highest quality |
| gpt-3.5-turbo | Parallel | 20-40s | ~$0.05 | Budget option |

## Resource Usage

### Memory
- Peak: ~500MB RAM
- Average: ~300MB RAM

### CPU
- Parallel execution: 30-50% (multi-core)
- Sequential execution: 15-25% (single-core)

### Network
- Average request: 2-5KB upload, 5-15KB download per agent
- Total per SRS: ~50-100KB

## Optimization Tips

1. **Use Gemini Pro for best balance** of speed and cost
2. **Enable parallel execution** when using Gemini/OpenAI
3. **Use sequential mode** only for Groq free tier
4. **Cache generated diagrams** to reduce regeneration time

## Test Environment

- **OS:** Windows 11 / Ubuntu 22.04
- **Python:** 3.12
- **CPU:** Intel i7-12700K
- **RAM:** 16GB DDR4
- **Network:** 100 Mbps

---

Last updated: 2026-02-08
