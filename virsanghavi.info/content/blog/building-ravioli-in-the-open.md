---
title: "What I've been up to: a few months of building Ravioli in the open"
pubDatetime: 2026-05-31
description: "Anti-cheat forensics, cold-emailing billionaires, surviving a YC rejection, and running my startup between AP exams. Some lessons from a chaotic stretch."
readingTime: 8
---

The last few months have been the most intense stretch of building I've done yet. [Ravioli](https://ravioli.live) went from a thing my friends used to a platform with real users in 10+ countries, $500K+ in virtual trading volume, and people coming back day after day. Somewhere in the middle of all that I also sat five AP exams and ground through SAT prep. I want to write down what I actually learned, because most of it I learned the hard way.

## Lesson #1: When you build something people care about, some of them will try to break it.

For a while I treated the growth numbers as pure good news. More users, more trades, more volume. Then I started noticing patterns that didn't add up: accounts making suspiciously perfect calls, trades landing at impossible times, the house fee math quietly leaking value.

So I turned into a forensic investigator. I went deep into our database with the Supabase MCP, reconstructing timelines trade by trade, and found a handful of users exploiting holes in the system. Some were trading after events had already resolved. Others were abusing slippage in the automated market maker. I clawed back the exploited proceeds from a couple of the worst offenders and then shipped real defenses: exploit detection, post-event trading detection, and a fix to the AMM fee logic that had been bleeding the platform.

The thing nobody tells you is that an adversarial user is actually a compliment. They cared enough to find the edges. But you cannot run a prediction game where the cheaters win, because the honest users feel it immediately and leave.

A couple of things I took from this:
- Build the anti-cheat layer earlier than you think you need it. The moment there's anything worth winning, someone will try to win unfairly.
- Logs are everything. The only reason I could prove what happened and reverse it was that the data was all there, timestamped and intact. Instrument first, investigate later.

## Lesson #2: The worst they can say is no, so just ask.

This stretch was my first real fundraising push, a pre-seed SAFE, and the scariest part was watching how much of it comes down to asking people for things when you have no obvious reason to expect a yes.

My cofounder ran a lot of the outreach, including to some serious names in finance and prediction markets, and watching it happen taught me the single most useful fundraising fact: warm intros are everything. One of the most promising threads came entirely through someone we already knew, who connected us to the person we actually wanted to reach. A genuine relationship turns a cold email into a real conversation. We spent way too long earlier worrying about perfecting cold outreach when the leverage was always in the network we already had a thread into.

The other thing I learned is that asking is a skill you only get by doing it badly first. The early messages were too long, too hedged, and buried the actual ask. The good ones are short, specific, and respect that the person is busy. You make it absurdly easy for them to say yes or pass.

What I'd tell past me:
- Map your network before you write a single cold email. There is almost always a path to the person you want to reach.
- Lead with the ask and the traction, not your life story. People who can help you will fill in the rest if the numbers are interesting.

## Lesson #3: A "promising" rejection is still a rejection, and that's fine.

We applied to YC for the Spring 2026 batch. We got an email back saying our application was "promising" and that they were holding it for extended review. For about two weeks I let myself believe.

Then they rejected us.

That one stung more than a clean no would have, because the hold made it feel close. But here's what I actually did with it: I treated the feedback as a roadmap. The recurring theme across YC GPs has been the same: user feedback is what matters most, and the product format itself needs to be genuinely fun, not just intellectually interesting. So instead of sulking, I went back into the product. The DAU, the 73% return rate, the 13-minute average sessions: those are the metrics that answer the exact concerns they raised. We're reapplying for the Summer batch with a much stronger story.

The lesson is boring but true: rejection from a place you respect is just data about the gap between where you are and where they want you to be. Close the gap and reapply.

- Don't read warmth into a maybe. Plan as if the answer is no and be pleasantly surprised.
- Every rejection from a serious investor comes with a thesis about what's missing. Mine it for the to-do list.

## Lesson #4: Automate yourself out of the bottleneck.

At some point I realized I was the bottleneck for almost everything: responding to user emails, running QA, watching agents trade. So I built my way out of it.

I set up a Mac Mini M4 as a dedicated orchestration box running automated agents around the clock, doing QA and trading so I don't have to babysit every flow. I also shipped a Gmail auto-response agent built on Google Apps Script with a Flask proxy on Render, so routine user emails get handled without me sitting in the inbox. And I rebuilt our scoring system into an ensemble AI model, v2, that's a lot more robust than the first pass.

The mental shift here was treating my own time as the scarcest resource in the company. Every hour I spent doing something a script could do was an hour I wasn't spending on the things only I can do.

- If you do a task more than a few times a week, it's a candidate for automation. Build the tool.
- The goal isn't to do more work. It's to make the work happen without you in the loop.

## Lesson #5: Constraints make you better, not worse.

The funny backdrop to all of this is that I'm still a sophomore in high school. While Ravioli was growing, I sat AP exams in Spanish Literature, Computer Science A, World History, Seminar, and Precalculus, and I was grinding SAT practice tests on the side.

I genuinely thought school would be the thing that killed my momentum. It did the opposite. Having almost no free time forced a brutal kind of prioritization. I couldn't chase every idea, so I only chased the ones that clearly mattered. I even folded the two worlds together: my Independent Study English assignment became a piece of prediction-market research using Ravioli's own data as the source. The constraint turned schoolwork into something that fed the company instead of competing with it.

- Limited time is a forcing function for focus. Treat it as a feature.
- Look for places where your obligations can overlap. The best projects do double duty.

## Where things stand

I'm still fundraising, still shipping, still studying for finals. Ravioli has a Microsoft for Startups grant in the bank and grassroots marketing running on actual business cards with a referral code on them. None of it is finished. That's sort of the point.

If there's one thread running through the past few months, it's that the interesting work lives right at the edge of what feels manageable. Building the thing, defending it from people trying to break it, asking for money, getting told no, and doing all of it between classes. I wouldn't trade it.

More soon.
