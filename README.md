# DefiLlama-Discord

## Info
- At start, 

## /getTVL [protocol]
- Get category, description (if DefiLlama has one) and TVL by chains for `protocol`
- On start we retrieve the current list of all protocols supported by DefiLlama. Additionally, we will store just the list of protocol names in memory for discord auto complete. TODO: Update on a time interval

## /syncprotocols
- Retrieves and updates all protocols DefiLlama has, for the autocomplete & protocol retrieval.