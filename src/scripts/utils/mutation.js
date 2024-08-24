const app = document.getElementById('app');
const postSelector = 'article.co-post-box:not([data-testid="composer-context"] article,.co-post-composer)';
const branchSelector = `${postSelector} > div:not([class]):has(div[id^='post-'])`;
const addedNodesQueue = [], removedNodesQueue = [];

export const mutationManager = Object.freeze({
  listeners: new Map(),
  triggers: new Map(),

  /**
   * start a mutation callback
   * @param {string} selector - css selector for elements to target
   * @param {Function} func - callback for matching elements
   */
  start (selector, func) {
    this.listeners.has(func) && (this.functions.delete(func));
    // this.triggers.has(func) && (this.triggers.delete(func));
    this.listeners.set(func, selector);
    // func.length === 0 && (this.triggers.set(func, selector));
    this.trigger(func);
  },
//
  /**
   * stop a mutation callback
   * @param {Function} func - function to remove
   */
  stop (func) {
    this.listeners.has(func) && (this.listeners.delete(func));
    this.triggers.has(func) && (this.triggers.delete(func));
  },

  /**
   * trigger a mutation callback on all matching elements
   * @param {Function} func - function to run
   */
  trigger (func) {
    const selector = this.listeners.get(func);
    if (!selector) return;

    if (func.length === 0) {
      const shouldRun = app.querySelector(selector) !== null;
      if (shouldRun) func();
      return;
    }

    const matchingElements = [...app.querySelectorAll(selector)];
    if (matchingElements.length !== 0) {
      func(matchingElements);
    }
  }
});

export const threadFunction = Object.freeze({
  functions: new Map(),

  /**
   * start a mutation callback on new threads
   * @param {Function} func - callback function for threads
   * @param {string} filter - optional filter
   */
  start (func, filter = false) {
    if (this.functions.has(func)) this.functions.delete(func);
    this.functions.set(func, filter);
    if (mutationManager.listeners.has(onNewThreads)) mutationManager.trigger(onNewThreads);
    else (mutationManager.start(postSelector, onNewThreads));
  },

  /**
   * stop a mutation callback
   * @param {Function} func - callback function to remove
   */
  stop (func) {
    this.functions.delete(func);
  }
});
const onNewThreads = threads => {
  for (const [func, filter] of threadFunction.functions) {
    filter ? func(threads.filter(post => post.matches(filter))) : func(threads);
  }
};

/* IMPORTANT: 
  cohost's react structure is currently bugged such that when reading the viewModel property of an individual post WITHIN a thread (which this observer supplies),
  that post's shareTree will be EMPTY, regardless of its opacity, where it was shared from, and how many posts precede it in the thread.
  as such, postFunction currently can *NOT* be used for callbacks that require access to previous posts within a thread.

  proper use cases: modules that operate independantly within a thread and do not require outside context; displaySource, yinglation
  example improper use case: bookmarks, as the bookmarked posts would be then be broken models containing only that specific tree item.
*/

export const postFunction = Object.freeze({
  functions: new Map(),

  /**
   * start a mutation callback on new posts
   * @param {Function} func - callback function for posts
   * @param {string} filter - optional filter
   */
  start (func, filter = false) {
    if (this.functions.has(func)) this.functions.delete(func);
    this.functions.set(func, filter);
    if (mutationManager.listeners.has(onNewPosts)) mutationManager.trigger(onNewPosts);
    else (mutationManager.start(branchSelector, onNewPosts));
  },

  /**
   * stop a mutation callback
   * @param {Function} func - callback function to remove
   */
  stop (func) {
    this.functions.delete(func)
  }
});
const onNewPosts = posts => {
  for (const [func, filter] of postFunction.functions) {
    filter ? func(posts.filter(post => post.matches(filter))) : func(posts);
  }
};


const funcManager = (funcMap, testNodes) => {
  for (const [func, selector] of funcMap) {
    if (func.length === 0) {
      const shouldRun = testNodes.some(testNode => testNode.matches(selector) || testNode.querySelector(selector) !== null);
      if (shouldRun) {
        try {
          func();
        } catch (e) {
          console.error(e);
        }
      }
      continue;
    }

    const matchingElements = [
      ...testNodes.filter(testNode => testNode.matches(selector)),
      ...testNodes.flatMap(testNode => [...testNode.querySelectorAll(selector)])
    ].filter((value, index, array) => index === array.indexOf(value));

    if (matchingElements.length !== 0) {
      try {
        func(matchingElements);
      } catch (e) {
        console.error(e);
      }
    }
  }
};
const nodeManager = () => {
  const addedNodes = addedNodesQueue
    .splice(0)
    .filter(addedNode => addedNode.isConnected);
  const removedNodes = removedNodesQueue.splice(0);

  if (addedNodes.length === 0 && removedNodes.length === 0) return;

  funcManager(mutationManager.listeners, addedNodes);
  funcManager(mutationManager.triggers, [...addedNodes, ...removedNodes]);
};

const observer = new MutationObserver(mutations => {
  const addedNodes = mutations
    .flatMap(({ addedNodes }) => [...addedNodes])
    .filter(addedNode => addedNode instanceof Element);
  const removedNodes = mutations
  .flatMap(({ removedNodes }) => [...removedNodes])
  .filter(removedNode => removedNode instanceof Element);

  addedNodesQueue.push(...addedNodes);
  removedNodesQueue.push(...removedNodes);

  requestAnimationFrame(nodeManager);
});

observer.observe(app, { childList: true, subtree: true });
