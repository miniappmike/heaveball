# Heaveball

Heaveball is a spectator-first fictional sports league built around a physical sport for everyday athletes. The playable milestone is an autonomous match that fans can watch, pause and use to understand the sport. The longer-term goal is a league fans can follow between games, with recognizable clubs, persistent players and reporting grounded in what happened on the field.

## Contributor orientation

The current release is a browser-local exhibition between Ember and Harbor. Open the [live Matchroom](https://heaveball-matchroom.hardyburl128.chatgpt.site) to generate squads and watch a match. Reloading starts a fresh session. The public GitHub repository contains the rules, playbook, player-generation spec, history and visual references. Matchroom’s simulation, renderer and release script live in its separate Sites source repository.

For gameplay changes, inspect the match JavaScript in the Site’s dist directory. The view JavaScript draws the field and players and handles the handbook and controls. The HTML provides layout and styles. The two textured dirt strips above and below the blue center square identify the no-possession area. Compare rule changes against the current handbook and this summary, especially the four-yard ring and the free run lane for touching a ball on dirt, which supersede the original draft geometry and strip treatment.

Before releasing, exercise roster generation, the start gate and the affected match rules. For pacing changes, sample full randomized games and report combined scores and possession duration in game-clock seconds. Keep the roadmap below distinct from shipped features. Current playtesting priorities include recognizing off-ball routes, spotting illegal touches and checking that center-zone tackles and runway control affect results.

## Watching a match

Ember and Harbor each field eight players. The pregame handbook explains the rules and shows both clubs’ average ratings, overall strength and a predicted spread based on their ratings. Generate new rosters redraws both teams and updates the comparison before kickoff. Play match starts the selected matchup. The numbered overhead view shows the ball, scoreboard, clock, play-by-play, possession share and runway control. A live box score tracks player and team points, attempts, completions, receptions, interceptions, tackles and fumbles, with a legend and team possession averages. Every scoring play holds the field and game clock for five real seconds at all playback speeds. Player scouting connects a jersey to its player, dimensions and skills. Playback opens at 1× and supports pause, 2×, 4× and 8×.

The handbook appears in the page with expandable team averages. Full screen fits the complete field to the landscape viewport with an exit control and clock. Browsers that restrict native fullscreen use an in-page field view. Jersey labels use measured digit bounds for centering. Narrow layouts stack the field above scouting and play-by-play. The build includes the match engine, renderer and dirt texture in the entry page for embedded previews. Each release should update this contributor guide and regenerate and sync both Markdown and Word copies.

## Player generation

| Role | Height | Weight | Jersey |
| --- | --- | --- | --- |
| Heaver | 5′8″–6′4″ | 170–220 lb | 00–99 |
| Runner | 5′7″–6′4″ | 155–240 lb | Usually 00–40 or 80–89 |
| Anchor | 5′11″–6′5″ | 200–260 lb | Usually 30–99 |

Builds cluster near each role’s midpoint. Two-digit jerseys are unique within a team. Runners and Anchors draw from their typical ranges 90% of the time. Ratings span 20–100, with team averages generated across 55–90 OVR. Roughly 85% of matchups explicitly draw an opponent within five overall points, while independent draws allow occasional mismatches. Team quality changes the underlying ratings. The generator preserves role biases toward throwing for Heavers, hands and agility for Runners, and strength for Anchors.

The eleven ratings are Arm Strength, Throw Accuracy, Strength, Speed, Jump, Hands, Reaction, Discipline, IQ, Kicking and Agility. The prototype also tracks energy during play. Mass, speed, strength, support and approach angle matter in contact. Roles describe typical strengths and movement eligibility.

## Field and scoring

Two teams play two 20-minute halves on a 50-by-34-yard field. Both attack one four-yard ring in a ten-yard square center zone. Green quadrants permit throwing and running. Yellow runways permit running and handoffs. All roles can enter the center zone. Only Anchors may cross into the opposing half. Players can traverse the intervening strips off the ball. A touch there awards the opponent a free run lane.

| Points | Play |
| --- | --- |
| 1 | Intercept a pass or recover a fumble in the center. Keep possession. |
| 2 | Carry the ball from outside the center through the ring. |
| 3 | Catch a teammate’s pass in the center and break the ring line under control. |
| 5 | Catch an airborne save kick in the center before it lands. Either team can score. |

## Possessions and restarts

Hand throws travel 20% faster than the previous release (1.5 times the original baseline), with flight time determined by throw distance and Arm Strength. On drive-and-kick possessions the carrier probes the runway, checks space ahead and fatigue, and retreats to a legal quadrant to pass when the lane closes. Outlet selection considers all roles, including Anchors, using separation, Hands and distance. Players read spacing, run routes on both halves, switch the ball across the field, use short outlets, attack the runway and hand off under pressure. Live carriers search for angles and slow with fatigue. Defenders mark receivers, close lanes and guard the ring. Agility and reaction shape jukes. Carriers favor safe throwing angles nearer the blue and can attack an open runway while building possession. When progress stalls or coverage tightens, the offense reads the entry lane and its Anchor matchup again. It can switch to drive-and-kick, a power run, an off-ball screen or an Anchor slip before the possession ends. One Anchor can screen a receiver’s marker while another draws help on the far side. Anchors remain eligible outlets and handoff options and can join a live pile to add force. Defenders keep a fading estimate of drives and screens, adjust ring depth and can switch coverage when a screen frees a receiver. Screen contacts and changes of assignment appear in play-by-play.

A quadrant tackle produces a stationary throw from the tackle spot. A runway tackle turns the ball over. A dive stopped short also turns it over, while a center catch stopped short retains possession. Incompletions stay live. Fumbles occur on tackles, and a recovered fumble restarts in the nearest quadrant. A free run lane gives the offense a Runner and blocker against two defending Anchors. A tackle there retains possession. A scoring club chooses the next restart quadrant after scoring two, three or five and must vary consecutive choices.

Quadrant-center resets pause for 1.5 simulation seconds. Defenders align goal-side of their marks, Anchors spread along the runway seams, and runway Runners begin two yards from the backline on offense or five yards from the center boundary on defense.

## Gameplay targets

The target is roughly 50 combined points on average, with most games between 30 and 80. IQ and Discipline influence a carrier’s estimate of runway space, a passer’s ability to recognize defenders in the passing lane, and a help defender’s choice to switch or stay with a dangerous cutter. Defensive Anchors shade closer to the ring, contact matters on contested receptions and defenders have a modest advantage finishing a tackle. The scoring values still come directly from the play. Possession length depends on opportunity and coaching style. Each new team draws a playbook with a baseline aggression and a set of preferred opening calls. Patient passing, Balanced, Free flow and Runway power teams take progressively earlier chances on average. Each individual call also adjusts how long the team builds an attack, how quickly the passer reads an outlet and how readily a carrier takes an open lane. Mid-possession adjustments can change that appetite for risk. Teams protecting a late lead play more conservatively. Long possessions can still develop when a patient team keeps finding outlets. A trailing team takes earlier chances late in the second half, with urgency increasing with the deficit. These targets guide randomized match testing. Fans should be able to see how an open outlet, a strong block or a timely stop changed a possession.

## League and media roadmap

The current browser prototype generates fresh exhibition matches. The planned league layer would retain player and club identities, schedule games and record standings, statistics and season history. Shared broadcasts would reveal events as they air. Recordings of player and ball movement alongside the event log would support replays, highlights and box scores. Pregame stories, recaps and ongoing media coverage would use those same records so a fan could trace a headline to the play that earned it. Persistent seasons, synchronized broadcasts, replay archives and an automated newsroom are future work.

## Source and release workflow

The sport repository holds the revised rulebook, coaching playbook, player-generation specification and fictional history. The Matchroom Site uses a browser simulation, a canvas renderer and a pregame interface. The prototype currently ends at regulation. The rulebook also describes substitutions and sudden death for later implementation. [Sport repository](https://github.com/miniappmike/heaveball)

Maintain the project scope in this file as features change. Running `python build.py` updates the versioned asset references and build record and creates matching Markdown and Word copies for the static build. The Word export requires Pandoc. When publishing a release, sync both copies to the public repository so contributors can review the same snapshot.

## Build record

Built 2026-11-20 11:41 UTC.

- match-f4a2e33c1e.js
- view-aa22bac6a5.js
