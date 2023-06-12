# DefiLlama-Discord

## /getTVL [protocol]
- Get category, description (if DefiLlama has one) and TVL by chains for `protocol`

## /syncprotocols
- Retrieves and updates all protocols DefiLlama has, for the autocomplete & protocol retrieval.

# Info
- On start we retrieve the current list of all protocols supported by DefiLlama. Additionally, we will store just the list of protocol names in memory for discord auto complete. TODO: Update on a time interval


# Notes
We will make a call for all protocols at the start of the bot every time. This is to support auto complete. Additionally, we will keep the command `syncprotocols` which is basically `refreshautocomplete`. We will not pull data from here though. For example, in `getprotocoltvl` we will make a call to  