/*
Better Youtube Replies:
    This extension makes YouTube replies easier to follow. First it sorts the replies 
    based on how many likes the comment has. Then it organizes the replies into threads 
    that make it easy to see who is replying to who. In addition, it adds buttons into 
    these threads to allow users to hide and show conversations so that they can get to 
    the conversations that they want to read.
    
Defects:
    1.  Can not create threads properly when author changes their name or reply
        gets deleted
    2.  Replies only load 10 at a time so it takes a while to load large reply threads
    3.  Many users do not use reply button so you can not tell who they are replying to
    4.  Buttons are updated at an interval instead of detecting DOM change
    5.  Page lags slightly when loading large reply threads
*/

//Store types for quick access
var buttonMap = new Map();
var commentMap = new Map();
var hiddenThreadMap = new Map();

//Detect when user opens a replies thread
var childList = {subtree: true, childList: true}
MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
var observer = new MutationObserver(detectReplies);
observer.observe(document, childList);

//Buttons have to be updated when element height changes
setInterval(updateButtons, 200);

//Starts program when user has opened a replies thread and then opens 
function detectReplies(mutationsList, observer){
    for(var mutation of mutationsList){
        if(mutation.target.id == "loaded-replies" && mutation.addedNodes.length){
            observer.disconnect(); 
            observer.takeRecords();
            createThreads(mutation);
            observer.observe(document, childList);
            getMoreReplies(mutation.target);
        }
    }
}

//Logic necessary to create the threads
function createThreads(repliesMutation){
    var replies = repliesMutation.target;
    var storedReplies = storeReplies(repliesMutation);
    var threads = Threads(storedReplies);
    threads = organizeThreads(threads);
    threads = getTopLevelThreads(threads);
    threads = sortThreads(threads);
    createButtons(threads);
    replaceReplies(replies, threads);
}

//replies are stored so that the original ordering can be used for sorting when newReplies arrive
function storeReplies(repliesMutation){
    var replies = repliesMutation.target;
    var newReplies = Array.prototype.slice.call(repliesMutation.addedNodes);
    var oldReplies = [];
    if(commentMap.has(replies)) oldReplies = commentMap.get(replies);
    commentMap.set(replies, oldReplies.concat(newReplies));
    return commentMap.get(replies);
}

//thread objects are used to keep track of which threads are replying to which threads
function Threads(replies){
    var threads = [];
    for(var i=0; i<replies.length; i++){
        var thread = {
            node: replies[i],
            numParents: 0,
            children: []
        }
        threads.push(thread);
    }
    return threads;
}

//Only top level threads are necessary since other threads are nested in the structure
function getTopLevelThreads(threads){
    var newThreads = [];
    for(var i=0; i<threads.length; i++){
        if(threads[i].numParents == 0){
            newThreads.push(threads[i]);
        }
    }
    return newThreads;
}

//for each thread finds all of its children and indents them
function organizeThreads(threads){
    for(var child=0; child<threads.length; child++){
        var childText = getText(threads[child].node);

        for(var parent=child-1; parent>=0; parent--){
            var parentAuthor = getAuthor(threads[parent].node);

            if(childText.includes(parentAuthor) && threads[child].numParents == 0){
                threads[child].numParents = threads[parent].numParents+1;
                threads[child].node.style.marginLeft = (35 * threads[child].numParents) + "px";
                threads[parent].children.push(threads[child]);
            }
        }
    }
    return threads;
}

//thread objects are nested inside each other, they must be converted into list for printing
function getPrintOrder(threads){
    var printOrder = [];
    for(var curr=0; curr<threads.length; curr++){
        printOrder.push(threads[curr]);
        var children = getPrintOrder(threads[curr].children);
        printOrder = printOrder.concat(children);
    }
    return printOrder;
}


//in order to re-order children the must be removed and added in the correct order
function replaceReplies(replies, threads){
    var printOrder = getPrintOrder(threads);
    var p=0, r=0;
    while(p < printOrder.length){
        if(replies.children[r].className == "displayBtn"){
            r++; continue;
        }
        if(replies.children[r] != printOrder[p].node){
            replies.removeChild(printOrder[p].node);
            replies.insertBefore(printOrder[p].node, replies.children[r]);
        }
        p++;r++;
    }
}

//likes are used to sort reply threads
function getLikes(reply){
    var likes = reply.querySelector("[id='vote-count-middle']").outerText.replace("K","000");
    if(likes.includes(".")){
        likes = likes.replace(".","");
        likes = likes.replace("0","");
    } 
    return likes;
}


//sort reply threads by amount of likes and sort all of its children
function sortThreads(threads){
    threads.sort(function(a,b){return getLikes(b.node) - getLikes(a.node);});
    for(var i=0; i<threads.length; i++){
        threads[i].children = sortThreads(threads[i].children);
    }
    return threads;
}

//author is used to find who a reply is replying to
function getAuthor(reply){
    return reply.querySelector("#author-text > span.style-scope").outerText;
}

//text is later searched to find who the reply is replying to
function getText(reply){
    return reply.querySelector("#content-text").outerText;
}



//the more replies button needs to be repetedly clicked to get the replies 10 at a time
function getMoreReplies(replies){
    var moreReplies = replies.parentElement.parentElement.querySelector("yt-next-continuation > paper-button");
    if(moreReplies) moreReplies.click();
}

//when display button is clicked, the thread and all of its children have to be displayed
function displayThread(thread){
    thread.node.style.display = "block";
    for(var i=0; i<thread.children.length; i++){
        displayThread(thread.children[i]);
    }
}

//this method is triggered every time a display button is clicked
function expandThread(event){
    var thread = buttonMap.get(event.target);
    event.target.parentElement.removeChild(event.target);
    hiddenThreadMap.delete(thread);
    displayThread(thread);
}

//display button is used to reveal comments that have been hidden by the threadbtn
function newDisplayButton(thread){
    console.log(thread);
    var button = document.createElement("span");
    var text = document.createTextNode("<" + getAuthor(thread.node) + " - " + getLikes(thread.node) + " likes>");
    button.appendChild(text);
    button.className = "displayBtn"
    button.style.marginBottom = "8px";
    button.style.color = "#606060";
    button.style.marginLeft = thread.node.style.marginLeft;

    button.onmouseover = function(){this.style.color = "#4e8de0";};
    button.onmouseleave = function(){this.style.color = "#606060";};
    button.onclick = function(event){expandThread(event)};
    return button;
}

//Hides thread and all of its children
function hideThread(thread){
    thread.node.style.display = "none";
    for(var i=0; i<thread.children.length; i++){
        if(hiddenThreadMap.has(thread.children[i])){
            thread.children[i].node.parentElement.removeChild(hiddenThreadMap.get(thread.children[i]));
            hiddenThreadMap.delete(thread.children[i]);
        }
        hideThread(thread.children[i]);
    }
}

//When thread button is clicked it hides the thread
function collapseThread(clicked){
    var thread = buttonMap.get(clicked);
    var displayButton = newDisplayButton(thread);

    observer.disconnect(); 
    observer.takeRecords();
    thread.node.parentElement.insertBefore(displayButton, thread.node);
    observer.observe(document, childList);
    
    buttonMap.set(displayButton, thread);
    hiddenThreadMap.set(thread, displayButton);
    hideThread(thread);
}

//height of all children necessary to create threadBtn
function getHeight(thread){
    var height = thread.node.clientHeight;
    if(thread.node.style.display == "none") return 18;
    for(var child of thread.children){
        height += getHeight(child) + 8;
    }
    return height;
}

//only creates one button per threadf
function newThreadButton(){
    var button = document.createElement("a");
    button.className = "threadBtn"
    button.style.position = "absolute";
    button.style.paddingLeft = "10px";
    button.style.borderRight = "2px solid #e0e0e0";
    button.onmouseover = function(){this.style.borderRight = "2px solid #60a2ff";};
    button.onmouseleave = function(){this.style.borderRight = "2px solid #e0e0e0";};
    button.onclick = function(){collapseThread(button)};

    var rightInput = document.createElement("a");
    button.appendChild(rightInput);
    rightInput.style.position = "absolute";
    rightInput.style.paddingRight = "12px";
    rightInput.style.height = "100%";
    rightInput.onmouseover = function(){button.onmouseover;};
    rightInput.onmouseleave = function(){button.onmouseleave;};

    return button;
}

//buttons necessary for hiding and displaying threads
function createButtons(threadsList){
    for(var i=0; i<threadsList.length; i++){
        var thread = threadsList[i];
        var button = thread.node.lastChild;
        if(button.className != "threadBtn"){
            var button = newThreadButton();
            thread.node.appendChild(button);
        }
        button.style.height = getHeight(thread) - 40 + "px";
        button.style.marginTop = thread.node.clientHeight*-1 + 35 + "px";
        buttonMap.set(button, thread);
        createButtons(threadsList[i].children);
    }
}


//client heights randomly change, so button heights have to be updated occasionally
function updateButtons(){
    buttonMap.forEach(function(value,key,_){
        var button = key;
        var thread = value;
        if(button.className == "threadBtn"){
            button.style.height = getHeight(thread) - 40 + "px";
            button.style.marginTop = thread.node.clientHeight*-1 + 35 + "px";
        }
    });
}