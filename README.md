# DefiLlama-Discord

DefiLlama-Discord is a discord bot to interact with DefiLlama's API for retrieving protocols and chains' Total Value Locked (TVL) information.

## Commands

### `/getprotocol [protocol] (includechart)`
Get information about a specific protocol. This command fetches the category, description (if available from DefiLlama), and TVL by chains for the specified `protocol`. 

- `protocol`: The name of the DeFi protocol you want information about.
- `includechart`: Include a chart visualizing the data by writing `true` in this argument.

### `/getchainstvl (limit) (order) (mintvl) (maxtvl) (includechart)`
Get information about TVL by chain. 

- `limit`: The number of chains to get (1-25).
- `order`: Sort the chains by highest TVL to lowest TVL or vice versa.
- `mintvl`: Sort the chains by minimum TVL. Accepts notation like "1K", "1M", "1B" etc.
- `maxtvl`: Sort the chains by maximum TVL. Accepts the same notation as `mintvl`.
- `includechart`: Optional. Include a bar chart visualizing the data by writing `true` in this argument.

### `/getpool [pool] (includechart)`
Get current and or historical APY and TVL of a pool. 

- `pool`: The pool symbol you want APY/TVL on.
- `includechart`: Include a historical chart of TVL and APY by writing `true` in this argument.

### `/syncprotocols`
Retrieve and update all protocols that DefiLlama has for the autocomplete & protocol retrieval functionality.

## Features

### Autocomplete Arguments
Autocompletes strings in `protocol` and `pool` arguments by using a list of known protocols and pools. The bot stores a local list for this purpose, which can be updated with the `/syncprotocols` command.
