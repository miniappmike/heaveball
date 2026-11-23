# Heaveball player generation and ratings

Generate players who feel like regular people playing a competitive contact sport. Most builds sit near the middle of their role's range. Overlapping builds and skills let players fill the same role in different ways. A player's rating describes their ability, while the situation on the field determines the result.

## Height and weight

| Role | Height range | Weight range | Suggested center |
| --- | --- | --- | --- |
| Heaver | 5′8″–6′4″ (68–76 in) | 170–220 lb | 6′0″, 195 lb |
| Runner | 5′7″–6′4″ (67–76 in) | 155–240 lb | 5′11½″, 197½ lb |
| Anchor | 5′11″–6′5″ (71–77 in) | 200–260 lb | 6′2″, 230 lb |

Average two uniform random draws between zero and one for each measurement, then scale the result into the role's range. About 75% of each measurement falls in the middle half of its range before display rounding.

For a modest height–weight correlation, reuse one of the height draws as one of the weight draws for half of generated players. Draw both weight values independently for the other half. This preserves both distributions and leaves room for tall, lean players and short, stocky players. Round for display and retain the generated values for the simulation. Convert weight to kilograms when setting physics mass.

## Ratings

Use integer ratings from **20 to 100**, with **60** typical on the league-wide scale. Start with a triangular distribution on that range, with 60 as the most common value. Raise the most common value to 75 for the role specialties below. This keeps scores above 90 rare and gives every role access to the whole scale. Heights and weights have no direct effect on generated skill ratings. Both the distribution and the role bias are starting values for playtesting.

| Rating | Gameplay effect |
| --- | --- |
| Arm Strength | Sets achievable throw speed and range. It supports fast line drives; insufficient strength raises the chance of an errant short-hop at distance. |
| Throw Accuracy | Controls how closely a pass follows the intended trajectory. Low Accuracy raises short-hop and overthrow risk, particularly when arm power exceeds control. |
| Strength | Governs how much force a player can apply or resist while blocking, standing up a block, tackling, breaking a tackle, stripping the ball, protecting against a strip, or driving a pile. |
| Speed | Sets top running speed. It affects separation, pursuit, and contact through the speed the player actually reaches. |
| Agility | Governs acceleration, braking, and how much speed a player can carry through a cut. |
| Tackling | Helps defenders wrap up and finish a tackle. Size, approach angle, momentum and support also affect the result. |
| Jump | Adds vertical reach for contested catches and deflections. |
| Hands | Governs catching, securing handoffs, retaining possession through a tackle or pile, protecting against a strip, executing a strip, and controlling a deflection when the player reaches the ball. |
| Reaction | Sets the delay between a cue and a player's response to a pass, cut, change of direction, or loose ball. Higher ratings mean shorter delays. |
| Discipline | Reduces the chance of a violation when a player is in a situation where one can occur. Keep penalties rare across the scale. |
| IQ | Governs the quality of AI decisions, including outlet selection, coverage, and adapting to what the opponent shows. |
| Kicking | Improves contact and directional control on a legal airborne save. AI considers its own kicking ability when deciding whether a reachable save is worth attempting. |

| Role | Ratings biased upward |
| --- | --- |
| Heaver | Arm Strength, Throw Accuracy |
| Runner | Agility, Hands |
| Anchor | Strength, Tackling |

Add **Stamina** when fatigue and recovery start to affect lineup or substitution decisions.

## Resolving plays

- **Movement and contact.** Use each player's mass and actual velocity to determine momentum. Resolve contact using the angle of impact, footing and bracing, then use Strength to determine how much force each player can apply or resist as contact continues. A running player can carry through glancing contact, and a braced defender can stop a carrier who meets them squarely. Speed already contributes through velocity, so apply its effect once.
- **Pile drives.** Do not add a separate pile trigger; preserve the existing frequency. Once formed, a pile lasts two to 25 game-clock seconds. Strength supplies most of each player's directional force, with weight and height contributing moderately. Nearby support adds force continuously. Tackling and IQ build the defense's finish progress, while carrier Strength, Hands, IQ, and Agility support control and an escape to a quadrant reset. Piles may also produce live fumbles, a rare concealed handoff to a free non-blocker, or a low-probability wild pass attempt.
- **Tackles, strips, and possession.** Use Tackling alongside Strength and the contact matchup. A failed juke, nearby help or a size advantage can make a solo stop easier. A carrier with enough speed and mass can run through a defender. Heavy, well-aligned hits can jar the ball loose on a carry or break up a catch. A small strip chance compares the defender's Strength, Hands, Reaction, and IQ with the carrier's same control traits. A successful rip releases a live loose ball. Hands helps secure the ball, and a ball knocked loose can bounce into a live recovery.
- **Selective loose-ball pursuit.** Rank realistic recovery candidates by proximity, Speed, Reaction delay, and IQ delay. Only the closest credible players pursue, with a hard cap of four; a second teammate joins only when genuinely close. Distant players preserve spacing and defensive assignments.
- **Ground scramble resolution.** Contested recoveries are low, physical battles with diving, falling, pushing, and shoving. Strength, Hands, Reaction, and proximity decide control while the ball squirts short distances near turf level instead of flying upward.
- **Turf ball response.** Model the ball as a softball-sized rubber ball on turf: it can skip and bounce visibly, but low restitution and surface grip drain vertical energy quickly. Deflections and fumbles may redirect it without producing bouncy-ball height.
- **Pass trajectories.** The lob is the standard pass. Line drives trade catchability and a flatter deflection path for speed. Bounce passes are slower and easier to handle but stay on one half because a ground contact in the dirt is out of bounds. When teammates are within four yards and neither faces an immediate defender, a low underhand lob receives a large catch-security bonus; at direct-exchange distance they can use a very safe handoff. Short-hops and overthrows are errant outcomes rather than designed calls.
- **Contested balls.** Use actual ball trajectory and player positions, with height setting standing reach and Jump adding vertical reach. Reaction determines how soon a player responds, and Speed helps close the path to the ball. Hands resolves control once a player can reach the ball. A high overthrow can sail above a receiver who lacks the reach to rescue it.
- **Penalties and saves.** Evaluate Discipline only where the rules allow a violation, such as a player nearing a restricted boundary or an offensive blocker approaching from behind. A kick save requires an eligible out-of-bounds player who can reach an airborne ball headed out. Resolve any resulting catch or recovery under the save rules.

## Playtest checks

- Generate a large roster and check bounds, central clustering, height–weight correlation, and overlap between roles. Verify that 60 is typical and 90-plus ratings are uncommon.
- Compare the same Runner and Anchor from a standstill, at speed, and at different contact angles. Check that momentum changes the result and that Strength matters in sustained contact.
- Compare two players with the same Speed and different Agility in a short runway burst and a late cut toward the center. Compare players with the same Agility and different Reaction on the same read.
- Confirm that tackles and fumbles follow the revised rulings, violations stay rare, and the chance to execute a kick save depends on its legal and physical opportunity.
- Compare all-99-Strength and all-50-Strength pile groups at equal size, then reverse them. Confirm the stronger group drives steadily, the weaker group does not, every pile stays within two to 25 seconds, and the pile-start rate itself is unchanged.

[Revised rulebook](Heaveball%20Rulebook%20%E2%80%94%20Revised%20Draft.pdf) · [Coaching playbook](Heaveball_Coaching_Playbook.md)
