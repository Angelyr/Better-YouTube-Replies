/*
Better Youtube Replies:
    When the user opens a replies thread, the mutation observer is triggered.
    Then the code takes the replies as input and converts them into threads that 
    make the conversation easier to follow. In addition, it adds buttons into these
    threads to allow users to hide and show conversations so that they can get to
    the conversations that they want to read.
Bugs:
    1. Sometimes extension does not trigger and page has to be reloaded
    2. Opening very large threads causes page to slow down
Defects:
    1. Can not detect replies when author changes their name
    2. Replies only load 10 at a time
    3. Many users do not use reply button
*/

var buttonMap = new Map(); //stores buttons so they can be accessed more quickly
var commentsMap = new Map(); //stores original order of comments for creating threads
var hiddenThreadMap = new Map(); 

//thread objects are nested inside eachother, so to access all of them I recursively
//get its children inorder to print them
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
    while(replies.firstChild){
        replies.removeChild(replies.firstChild);
    }
    var printOrder = getPrintOrder(threads);
	for(var i = 0; i < printOrder.length; i++){
        replies.appendChild(printOrder[i].node);
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

//returns threads list which contains only the top level threads, the other threads are redundant
//because they are nested inside other threads
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
                threads[child].node.style.marginLeft = (40 * threads[child].numParents) + "px";
                threads[parent].children.push(threads[child]);
            }
        }
    }
    return threads;
}

//the more replies button needs to be repetedly clicked to get the replies 10 at a time
function getMoreReplies(replies){
    if(commentsMap.get(replies).length < 200){
        var moreReplies = replies.parentElement.parentElement.querySelector("yt-next-continuation > paper-button");
        moreReplies.click();
    }
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
    var button = document.createElement("span");
    var text = document.createTextNode("<" + getAuthor(thread.node) + " - " + getLikes(thread.node) + " likes>");
    button.appendChild(text);
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
function collapseThread(event){
    var thread = buttonMap.get(event.target);
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

//only creates one button per thread
function newThreadButton(){
    var button = document.createElement("a");
    button.className = "threadBtn"
    button.style.paddingLeft = "1.5px";
    button.style.paddingRight = "1.5px";
    button.style.background = "#DCDCDC";
    button.style.zIndex = 3000;
    button.style.position = "absolute";
    button.style.borderLeft = "10px solid white";
    button.style.borderRight = "10px solid white";
    button.onmouseover = function(){this.style.background = "#4e8de0";};
    button.onmouseleave = function(){this.style.background = "#DCDCDC";};
    button.onclick = function(event){collapseThread(event)};
    return button;
}

//for each thread a button is created for astetic purposes
//button is stored with thread so it can be easily accessed for updating btn
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

//calls all thread methods necessary to create threads
function createThreads(replies, storedReplies){
    var threads = Threads(storedReplies);
    threads = organizeThreads(threads);
    threads = getTopLevelThreads(threads);
    threads = sortThreads(threads);
    createButtons(threads);
    replaceReplies(replies, threads);
}

//replies are stored so the original ordering can be used, then creates threads
function processReplies(repliesMutation){
    var replies = repliesMutation.target;
    var newReplies = Array.prototype.slice.call(repliesMutation.addedNodes);
    var oldReplies = [];
    if(commentsMap.has(replies)) oldReplies = commentsMap.get(replies);
    commentsMap.set(replies, oldReplies.concat(newReplies));

    createThreads(replies, commentsMap.get(replies));
}

//Detect when replies have loaded and pass on the new replies
var childList = {subtree: true, childList: true}
MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
var observer = new MutationObserver(function(mutationsList, observer) {
    for(var mutation of mutationsList){
        if(mutation.target.id == "loaded-replies" && mutation.addedNodes.length){
            observer.disconnect(); 
            observer.takeRecords();
            processReplies(mutation);
            observer.observe(document, childList);
            getMoreReplies(mutation.target);
        }
    }
});
observer.observe(document, childList);


//client heights randomly change, so button heights have to be updated occasionally
setInterval(updateButtons, 200);
function updateButtons(){
    buttonMap.forEach(function(value,key,map){
        var button = key;
        var thread = value;
        if(button.className == "threadBtn"){
            button.style.height = getHeight(thread) - 40 + "px";
            button.style.marginTop = thread.node.clientHeight*-1 + 35 + "px";
        }
    });
}