---
title: "My experience attending two YC hackathons back-to-back"
pubDatetime: 2026-03-02
description: "Feeling super blessed. Attended Browser-Use and Manufact hackathons in the span of two weeks and learned a lot."
readingTime: 7
---

I recently was selected to attend two YC hackathons within two weeks of each other, and I want to share what I took away from each one.

## Hackathon #1: Don't bite off more than you can chew.

[Manufact](https://manufact.com/)

At this hackathon, my team tried to build a Kalshi/Polymarket arbitrage bot that would run 24/7 inside ChatGPT or Claude as an MCP widget. The idea was awesome. The problem was that it was way too much for an 8-hour hackathon. We were juggling multiple APIs, building out arbitrage logic, and trying to get it all running as an MCP widget at the same time. Each of those is a hackathon project on its own. We ended up with something half-baked across the board instead of one polished thing.

Going forward there are a couple of changes I want to make:
- Scope down aggressively. Pick the one thing that demos well and nail it. You can always build more later.
- Prepare for the demo, not the actual product. Even if the product works 90% of the time, if it breaks or is dysfunctional during the demo there's little possibility of you winning.

Beyond the project itself, the best part of this hackathon was the people I got to talk to. I had a long conversation with Pietro Zullo, a cofounder of MCP Use (Manufact), who gave me a ton of life advice and real talk about what building a company actually looks like.

I also got to speak with Jon Xu, a general partner at YC, about my startup [Ravioli](https://ravioli.live). He said the idea seemed very intriguing and told me that the way to make our application more compelling for an interview is by updating them with feedback we've been getting from real users. He said user feedback is what ultimately matters the most.

He also shared some honest concerns. One was about users gaming the system. Another was about the platform being too boring. He gave an example: people trying to predict the most searched Google query on any given day, and compared that to betting on which side would score better on average via logic markets. His point was that the format itself needs to be engaging, not just intellectually interesting.

He asked about my relationship with my cofounder Wyatt, and cited some concerns about us working together primarily because of complementary skills given our age gap. He was reassured when I told him that we genuinely enjoy working together. He asked how I met Wyatt, and I told him: Wyatt was a scout for a VC firm, Outlier Capital Group, that wanted to invest in Tilt (Ravioli's predecessor).

Getting that kind of direct feedback from a YC GP about your actual startup is not something you can replicate. It's reason enough to show up.

## Hackathon #2: Impress the right judges, control what you can.

[Browser-Use](https://browser-use.com/)

In 24 hours, my partner and I built [Browser-Swarm](https://browser-swarm.com/) (dysfunctional now, but it was cool while it lasted): a multi-agent browser OS. Not one AI browsing the web. A team of AIs. One books flights, one finds hotels, one plans attractions. They run in parallel, share a live group chat, self-heal failures, rotate fingerprints, and beat anti-bot systems. They converge on one answer. You watch it think.

We demo'd a full Tokyo trip planned with 92% confidence in real time. Applications go way beyond travel.

Honestly, most of the technical stuff we figured out at 3am through trial and error - getting the agents to not step on each other, recovering when one broke, and making sure they could actually share what they found. It was messy, but by morning we had 8 browsers collaborating in real time, which felt kind of surreal.

At this hackathon, I learned 2 super important lessons:
- When you ask a potential judge for feedback, ensure you follow through with it. One of the sponsors of the hackathon built an easy eval framework for models, and he ended up judging us. During the build phase, he told us we should run evals on our project. We didn't get time to do it. In hindsight, that should have been the priority the moment he said it. When someone who's going to evaluate your work tells you exactly what they want to see, drop what you're doing and make it happen.
- Don't be upset about controlling the things you aren't able to. For judging, there were 5 rooms total, of which the top 6 scoring teams out of 50 would get to present on stage. The problem was that judging in each room was subjective, and the judges in my room gave every team relatively lower scores, meaning that no one from our room made finals.

However, this hackathon was a great experience. My partner and I posted what we built on Twitter/X and saw our post hit over 1,000 likes in under 24 hours. My account also blew up, going from under 50 to over 500 followers in that same time period. We ended up winning AirPods Max for the "Most Viral" award, which was a pretty solid consolation for not making finals.