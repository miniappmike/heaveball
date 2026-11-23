This project draws direct inspiration from the Reddit post "I invented a sports league that runs itself. Fock Ball simulated 38 years of history, airs a live 3D broadcast every night, runs its own newsroom and social media, and arrests its own players" https://www.reddit.com/r/ClaudeAI/comments/1xyklpy/i_invented_a_sports_league_that_runs_itself_fock/

The post contents are: TL;DR: I built Fock Ball, a made-up sport with 30 teams and 38 years of simulated history, and Claude coded it. Every game is played by a physics sim and broadcast live in 3D at fockball.com. Claude writes the announcers, the news and the social feed, and a highlight from every game posts itself to TikTok, Instagram and YouTube.

How it started
Hello! I’m a Product Designer by trade who (perhaps foolishly) spent the last 5 months building a fake sports league with Claude. The idea actually started a few years ago, when a buddy and I recorded an hour-long podcast about a sport that didn’t actually exist. The problem was it was impossible to keep track of all the details of a league — player names, game results, trades — and be consistent across more than one episode. It was fun, but we never shipped it. Flash forward to this summer. I’m experimenting with Claude Code and realize that this is the tool to finally turn my silly idea into reality.

A quick aside
You may have seen the AI Aussie rules league post here recently. Shoutout to u/AFL_gains for a fun build, and the timing is uncanny. Fock Ball takes almost the opposite approach. There, Claude coaches the teams and decides how they play. Here, no AI touches the game at all. A physics sim plays every game, and Claude runs the whole media operation around it. Let's get into it.

The sport
Fock Ball is modified football. It's seven on seven on a football field, with sand traps running down both sidelines. There's no kicking and no set positions, so anyone can run, throw or catch.

You score by getting the ball into the goal at either end. Running it in or a short throw is 3 points, and a long throw is 5. Each goal also has rings painted in it. Catch a long throw with both feet inside a ring and it's worth 7, or 10 for the small one in the middle. A game is three 15-minute periods.

The game engine
Most of the last 5 months went into the game engine, and I rebuilt it several times.

Rolling dice. The first version rolled numbers for each player and spat out a box score. That was fine for stats, but there was nothing to watch.

Play by play. Next it played out each possession in order with a game clock and wrote every play to a log. The box score is added up from that log, so the stats and the story always match. I showed it as dots moving on a field. Solid, but I wanted more.

3D broadcast. After getting tired of staring at dots, I decided to build a proper 3D broadcast. I started with my play-by-play sim and had animation fake the movement to match. It was a mess. Players teleported randomly around the field, the ball bent in the air, and weeks of patches never fixed it. I learned you can't animate your way to reality when nothing is really moving. During this phase I also experimented with using a Meshy-to-Blender pipeline for more realistic players. They looked great visually but the rigging and animations were sloppy and less realistic than having Claude sculpt and animate directly in code. I finally landed on a Pixar-style look. It's real enough to show emotion, and cartoony enough that you forgive the animation when it isn't perfect.

Real physics. After about 6 weeks of work I threw out the engine and rebuilt it. Now the field is a real place, and every player and the ball has an exact spot on it. The sim moves every player and the ball 20 times a second. At each step, every player decides what they're doing, like getting open, covering someone or chasing the ball, and their ratings set how fast they can run, turn, throw and catch. Once the ball leaves a hand, it flies on gravity and wind. A catch happens when the ball actually reaches someone's hands, and a tackle happens when a defender actually gets there. Even the ref has to walk over and set the ball down before play restarts. Each game is about 30,000 snapshots (2 MB of data) and doesn’t fake anything. That's when it started to look like a real sport.

Game day
Now that I had a game, I needed to build the world around it. I started with a simple venue: grandstands, lights, a team bench. Then I wanted each team to have their own venue, so I generated reference images for each team with Google’s Nano Banana and had Claude build them all. Spending time getting the references right actually made this a fairly painless process. Then I wanted a 3D flyover to start the game, and had Claude model the city and environment around each club. 

Next I fleshed out the broadcast with an animated open, pregame countdown, intermissions and a closing segment. Two announcers, Dale and Tank, call every play. Claude writes their lines from the game's log, and Kokoro, an open-source voice model, reads them for free on my Mac mini. When it mispronounces a name, the fix goes on a pronunciation list, and speech recognition listens back to make sure it's right.

Under the booth there's crowd noise and a stadium organist. The organ is synthesized entirely in code. I worked with Claude to create 12 original riffs, which can shrink or expand to fill real game time, and it sounds different in a dome than in an open-air stadium. 

The stands are full of fans, and outdoor games are played in each city's real forecast, pulled every morning from the National Weather Service (and MET Norway for the one stadium in Canada). If it's raining there, it's raining in the game!

The teams and players
All 30 teams have an original, branded identity. Logos were generated with Google’s Nano Banana, and their color identity is used on uniforms, in venues and across the site. 

Players are generated body first. Height, weight and build are rolled before anything else, then 19 ratings from 0 to 99, like a video game: arm strength, accuracy, hands, speed, tackling, how well they play in the sand, stamina and more. A player's role sets the general shape, so a thrower throws well and is ordinary at the rest. His body pushes the physical ratings: a heavier player is stronger but slower, and a taller one wins more jump balls. About 1 in 20 players is elite at one thing, and about 1 in 200 is a generational talent who's great at two. Every player also has a hidden drive rating that nobody sees, which shapes who blooms late and who wastes his talent. Ratings then change every year as players develop and age.

Each player also gets a personality, how likely he is to get into trouble, a look and a bio. Then he gets a headshot. Code photographs the same 3D player you see in the broadcast, in his team's uniform, and that photo follows him everywhere: his player page, the news, the social feed and the broadcast's on-screen graphics. If he's traded or starts going gray, he gets a new one. Coaches and owners get generated and photographed too. Coaches get fired, and owners retire and hand the team to an heir or sell it.

League History 
I didn't want to write the league's history. I wanted it to be played. So I outlined the big story myself. The league starts in 1988 as four beach clubs on the Jersey Shore and in Virginia Beach, becomes a real league in 1993, and grows to 30 teams in four waves of expansion through 2011. I also had the league go dark for three years after the 2008 crash and three more for COVID, because that's what I assumed a struggling minor league would do. 

Then the sim took over. It played every season from 1988 to 2025 through the same code that runs the league today: the schedule, every game, the playoffs, then the draft, free agency, trades, retirements and the Hall of Fame. Nothing in between was written by hand. One full run takes about five hours.

After each run I read through the results like a fan would, looked for anything that felt off, tweaked the rules and ran it all again. The fifth run stuck: 8,513 games, about 2,360 players, coaches and owners, and 45 Hall of Famers. Santa Cruz became the dynasty, with four championships in five years. Fargo has never made the playoffs. And Anchorage, one of the worst teams in league history, made the playoffs twice in 15 seasons and won it all once. I locked it down. This is now canon. 

Front office and trouble
Teams run like real teams. There's a hard salary cap, contracts with guaranteed money, free agency, drafts, expansion drafts, waivers and an injured list. Teams trade players and draft picks, and losing teams sell at the deadline. 

Off the field, players get into trouble, from a DUI on a riding mower to stealing hotel bathrobes in bulk. Some just have bad luck, like getting bitten by an alligator while golfing. The ones who get in trouble are fined or suspended, and all of it ends up in the news.

The newsroom
Five reporters cover the league, each with their own beat and voice. There's a Monday recap, Friday power rankings, a game story the morning after a great game, a look at the week ahead and a police blotter for the troublemakers. A social feed runs all week with reporters and players chiming in to comment about games and drama around the league. Claude writes all of it, but it only gets the facts the sim recorded, so it can't invent a score or a stat. Code checks each piece against those facts and throws it out if anything doesn't match.

After every game, a highlight of its best play goes up on the site. Code picks the play, shoots it like a camera crew would and writes the caption. Once a day, the best one gets cut for phones and posted to TikTok, Instagram and YouTube through Buffer's API, timed for when each platform's audience is most active.

It's live, and it runs itself
The league doesn't need me anymore. There are 15 games a week, played one at a time so they never overlap: one a night Monday through Wednesday at 7:30 ET, two on Thursday and Friday, and four each on Saturday and Sunday. The best matchups get the prime-time slots.

Every morning a Mac mini plays that day's games in the real forecast for each city. It writes and voices the announcers, then locks everything away. The database won't show anyone a score, a stat or a single play until the game airs.

An hour before kickoff, the home page and the game page switch to a countdown. The broadcast starts about 90 seconds early, so the first whistle lands right on time. From there it plays out live, like TV, with everyone watching the same play at the same moment. You can pause or rewind, but you can never get ahead of live, and the score, play-by-play and stats only show what has happened so far.

At the final whistle the score and standings update, and the highlight posts 15 minutes later. Trades, signings, articles and posts all go out on their own schedule.

The scale
All of this is about 140,000 lines of code and more than 1,200 commits in under five months, on the $100 Claude Max plan. Over 8,500 games across 38 years of history (every game, stat line, contract and trade) fit in about 120 MB of database. The announcers have called 76 games so far this season: more than 60,000 lines and about 42 hours of audio, all voiced on a Mac mini.

What's next
Today is launch day, but it’s just the start. I’m ready to start scheming out a higher-fidelity broadcast with more between-plays content and refined animations, expanded social media content, merchandising for teams that don't exist, and maybe even that podcast my buddy and I never shipped. If there's something you'd want to see, let me know!

This is the end of the Reddit post.
I want an evolving sports league that runs itself and builds history based around the gameplay of my new invented fiction sport as outlined in this repo.

Tune in
It's all at fockball.com. There's a game on tonight at 7:30 ET—Tacoma Gnomes at Anchorage Glaciers— if you want to watch one live. Highlights from every game go up on TikTok (@fockball), Instagram (@fock.ball) and YouTube (@fockball), and r/fockball is the place to talk about the league. Thanks for taking the time to check out my obsession. Happy to answer any questions about how it all works!
