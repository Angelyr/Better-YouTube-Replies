# Better YouTube Replies
This extension makes YouTube replies easier to follow. First it sorts the replies based on how many likes the comment has. Then it organizes the replies into threads that make it easy to see who is replying to who. In addition, it adds buttons into these threads to allow users to hide and show conversations so that they can get to the conversations that they want to read.

# Download
https://chrome.google.com/webstore/detail/better-youtube-replies/mkckdflcdohccnphonfgljjeckdphomf/related?authuser=1

# Defects
1. Rant: This code has a lot of funtions. One of the advantages is that method names are self-documenting, so less comments are necessary, which means that comments don't need to be updated as much. However, it is hard to follow the line of reasoning through the code. I would consider refactoring some of the functions such that they are nested functions inside of the functions calling them. This would make it easier to follow the sequence of events through the code. However, I would have to be careful with spacing and comments so legibility of the functions does not suffer. I also need to make sure that I don't lose the self-documenting nature of good functions. If I were to refactor this, I should make psudocode to layout the new structure.
2. Buttons are updated on an interval instead of detecting when a Dom change has occured.  
3. Can not create threads properly when author changes their name or reply gets deleted
4. Replies only load 10 at a time
5. Many users do not use reply button so you can not tell who they are replying to

# Bugs
1. Limited to first 200 replies because if any more load than page begins to lag
