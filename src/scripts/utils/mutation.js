const app = document.getElementById('app');
const postSelector = 'article.co-post-box:not(.co-post-composer)';
const branchSelector = `${postSelector} > div:not([class]):has(div[id^='post-'])`;
const addedNodesQueue = [];

export const mutationManager = Object.freeze({
  listeners: new Map(),

  /**
   * start a mutation callback
   * @param {string} selector - css selector for elements to target
   * @param {Function} func - callback for matching elements
   */
  start (selector, func) {
    if (this.listeners.has(func)) this.listeners.delete(func);
    this.listeners.set(func, selector);
    this.trigger(func);
  },
//
  /**
   * stop a mutation callback
   * @param {Function} func - function to remove
   */
  stop (func) {
    if (this.listeners.has(func)) this.listeners.delete(func);
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
   * @param {string} selector - css selector for elements to target
   * @param {Function} func - callback function for matching elements
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
    this.functions.delete(func)
  }
});
const onNewThreads = posts => {
  for (const [func, filter] of threadFunction.functions) {
    filter ? func(posts.filter(post => post.matches(filter))) : func(posts);
  }
};

export const postFunction = Object.freeze({
  functions: new Map(),

  /**
   * start a mutation callback on new posts
   * @param {string} selector - css selector for elements to target
   * @param {Function} func - callback function for matching elements
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
const onNewPosts = branches => {
  for (const [func, filter] of postFunction.functions) {
    filter ? func(branches.filter(post => post.matches(filter))) : func(branches);
  }
};

const nodeManager = () => {
  const addedNodes = addedNodesQueue
    .splice(0)
    .filter(addedNode => addedNode.isConnected);

  if (addedNodes.length === 0) return;

  for (const [func, selector] of mutationManager.listeners) {
    if (func.length === 0) {
      const shouldRun = addedNodes.some(addedNode => addedNode.matches(selector) || addedNode.querySelector(selector) !== null);
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
      ...addedNodes.filter(addedNode => addedNode.matches(selector)),
      ...addedNodes.flatMap(addedNode => [...addedNode.querySelectorAll(selector)])
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

const observer = new MutationObserver(mutations => {
  const addedNodes = mutations
    .flatMap(({ addedNodes }) => [...addedNodes])
    .filter(addedNode => addedNode instanceof Element);

  addedNodesQueue.push(...addedNodes);

  requestAnimationFrame(nodeManager);
});

observer.observe(app, { childList: true, subtree: true });
