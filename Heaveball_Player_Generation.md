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
| Arm Strength | Sets achievable throw speed and range. |
| Throw Accuracy | Controls how closely a pass follows the intended trajectory. |
| Strength | Governs how much force a player can apply or resist while blocking, standing up a block, tackling, breaking a tackle, or driving a pile. |
| Speed | Sets top running speed. It affects separation, pursuit, and contact through the speed the player actually reaches. |
| Agility | Governs acceleration, braking, and how much speed a player can carry through a cut. |
| Tackling | Helps defenders wrap up and finish a tackle. Size, approach angle, momentum and support also affect the result. |
| Jump | Adds vertical reach for contested catches and deflections. |
| Hands | Governs catching, securing handoffs, retaining possession through a tackle or in a pile, and controlling a deflection when the player reaches the ball. |
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

- **Movement and contact.** Use each player's mass and actual velocity to determine momentum. Resolve contact using the angle of impact, footing and bracing, then use Strength to determine how much force each player can apply or resist as contact continues. A running player can carry through glancing contact, and a braced defender can stop a carrier who meets them squarely. Speed already contributes through velocity, so apply its effect once. On a pile drive, use the forces that the engaged players can transmit in the direction of the drive.
- **Tackles and possession.** Use Tackling alongside Strength and the contact matchup. A failed juke, nearby help or a size advantage can make a solo stop easier. A carrier with enough speed and mass can run through a defender. Heavy, well-aligned hits can jar the ball loose on a carry or break up a catch. Hands helps secure the ball, and a ball knocked loose can bounce into a live recovery.
- **Contested balls.** Use actual ball trajectory and player positions, with height setting standing reach and Jump adding vertical reach. Reaction determines how soon a player responds. Hands resolves control once a player can reach the ball.
- **Penalties and saves.** Evaluate Discipline only where the rules allow a violation, such as a player nearing a restricted boundary or an offensive blocker approaching from behind. A kick save requires an eligible out-of-bounds player who can reach an airborne ball headed out. Resolve any resulting catch or recovery under the save rules.

## Playtest checks

- Generate a large roster and check bounds, central clustering, height–weight correlation, and overlap between roles. Verify that 60 is typical and 90-plus ratings are uncommon.
- Compare the same Runner and Anchor from a standstill, at speed, and at different contact angles. Check that momentum changes the result and that Strength matters in sustained contact.
- Compare two players with the same Speed and different Agility in a short runway burst and a late cut toward the center. Compare players with the same Agility and different Reaction on the same read.
- Confirm that tackles and fumbles follow the revised rulings, violations stay rare, and the chance to execute a kick save depends on its legal and physical opportunity.

[Revised rulebook](Heaveball%20Rulebook%20%E2%80%94%20Revised%20Draft.pdf) · [Coaching playbook](Heaveball_Coaching_Playbook.md)
