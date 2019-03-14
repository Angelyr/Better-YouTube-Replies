# Better YouTube Replies
This extension makes YouTube replies easier to follow. First it sorts the replies based on how many likes the comment has. Then it organizes the replies into threads that make it easy to see who is replying to who. In addition, it adds buttons into these threads to allow users to hide and show conversations so that they can get to the conversations that they want to read.

# Download
https://chrome.google.com/webstore/detail/better-youtube-replies/mkckdflcdohccnphonfgljjeckdphomf/related?authuser=1

# Mistakes
1. This code has a lot of funtions. While it is easy to tell what all the functions do, it is hard to follow the line of reasoning through the code. I would consider refactoring some of the functions such that they are nested functions inside of the functions calling them. This would make it easier to follow the sequence of events through the code. However, I would have to be careful with spacing and comments so legibility of the functions does not suffer.
2. Buttons are updated on an interval instead of detecting when a Dom change has occured
