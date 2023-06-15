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

### `/getpools (limit) (order) (mintvl) (maxtvl) (minapy) (maxapy) (chain) (includechart)`
Get a list of pools filtered and ordered by chain, tvl and apy.

- `limit`: The number of pools you want returned (from 1-25). Defaults to 10 if not provided.
- `order`: Sort pools by highest to lowest APY or TVL and vice versa. Options: 'Highest to lowest APY', 'Highest to lowest TVL', 'Lowest to highest APY', 'Lowest to highest TVL'. Defaults to 'descending' if not provided.
- `mintvl`: Filter out any pools with a lower TVL than the given value. Value is a string representing the minimum TVL, accepts notation like "1K", "1M", "1B" etc. Defaults to '0' if not provided.
- `maxtvl`: Filter out any pools with a higher TVL than the given value. Value is a string representing the maximum TVL, accepts the same notation as `mintvl`. Defaults to '100T' if not provided.
- `minapy`: Filter out any pools with a lower APY than the given value. Value is a number representing the minimum APY. Defaults to 0 if not provided.
- `maxapy`: Filter out any pools with a higher APY than the given value. Value is a number representing the maximum APY. Defaults to Infinity if not provided.
- `chain`: Filter pools by chain name. Value is a string representing the chain name.
- `includechart`: Optional. Include a pie chart visualizing the data. Value is a boolean.


### `/syncprotocols`
Retrieve and update all protocols that DefiLlama has for the autocomplete & protocol retrieval functionality.

## Features

### Autocomplete Arguments
Autocompletes strings in `protocol` and `pool` arguments by using a list of known protocols and pools. The bot stores a local list for this purpose, which can be updated with the `/syncprotocols` command.
