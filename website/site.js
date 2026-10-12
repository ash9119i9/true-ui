(() => {
  'use strict';

  const root = document.documentElement;
  const byId = (id) => document.getElementById(id);
  const setText = (id, value) => {
    const element = byId(id);
    if (element) element.textContent = value;
  };

  // These illustrative examples use the built-in agents from the product spec.
  // They show a proposed workflow, not a live session or completed customer work.
  const workflows = {
    research: {
      title: 'A clearer picture. A shared starting point.',
      prompt: '@research Build a research brief on our next market. Bring the sources and open questions into one thread.',
      agent: 'Researcher',
      handle: '@research',
      initial: 'R',
      response: 'A shared brief brings the market context, source links, and open questions together. Your team can review the evidence and decide what to explore next.',
      file: 'market-research-brief.md',
      steps: ['Define the research goal', 'Gather and compare sources', 'Share the brief for review'],
      caption: 'Illustrative workflow · Research, sources, and decisions in one shared thread.',
    },
    analysis: {
      title: 'From a business question to a useful next step.',
      prompt: '@qlik Help us understand this dashboard. Outline the metrics to review and the questions our team should investigate.',
      agent: 'Qlik Analyst',
      handle: '@qlik',
      initial: 'Q',
      response: 'Start with the metrics that matter to your goal. Keep the analysis, context, and follow-up questions in the same thread so your team can review the reasoning.',
      file: 'dashboard-review.md',
      steps: ['Set the analysis goal', 'Review dashboards and metrics', 'Bring the team into the discussion'],
      caption: 'Illustrative workflow · Dashboards, metrics, and BI questions with a named agent.',
    },
    writing: {
      title: 'The context is already here. So is your first draft.',
      prompt: '@writer Turn our project notes into a clear launch brief. Keep the draft in this thread so the team can shape it together.',
      agent: 'Writer',
      handle: '@writer',
      initial: 'W',
      response: 'A launch brief gives the team one place for the story, key messages, and next steps. Review the draft together, refine the details, and keep the project context close.',
      file: 'launch-brief.md',
      steps: ['Bring in the project context', 'Shape the brief', 'Review and refine together'],
      caption: 'Illustrative workflow · Documents, release notes, and briefs with your team in the loop.',
    },
  };

  const menuToggle = byId('menu-toggle');
  const siteNav = byId('site-nav');
  const setMenuOpen = (open) => {
    if (!menuToggle || !siteNav) return;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    siteNav.dataset.open = String(open);
    siteNav.classList.toggle('is-open', open);
    root.dataset.menuOpen = String(open);
  };
  if (menuToggle && siteNav) {
    setMenuOpen(false);
    menuToggle.addEventListener('click', () => {
      setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
    });
    siteNav.querySelectorAll('a, [data-demo]').forEach((link) => {
      link.addEventListener('click', () => setMenuOpen(false));
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
        setMenuOpen(false);
        menuToggle.focus();
      }
    });
    document.addEventListener('click', (event) => {
      if (!siteNav.contains(event.target) && !menuToggle.contains(event.target)) setMenuOpen(false);
    });
  }

  const themeToggle = byId('theme-toggle');
  const storedTheme = (() => {
    try { return localStorage.getItem('truex-website-theme'); }
    catch { return null; }
  })();
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  let explicitTheme = storedTheme === 'light' || storedTheme === 'dark';
  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
      themeToggle.setAttribute('title', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
      themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
    }
    setText('theme-label', theme === 'dark' ? 'Dark' : 'Light');
  };
  applyTheme(explicitTheme ? storedTheme : (root.dataset.theme || (systemTheme.matches ? 'dark' : 'light')));
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      explicitTheme = true;
      applyTheme(nextTheme);
      try { localStorage.setItem('truex-website-theme', nextTheme); }
      catch { /* The toggle still works if storage is unavailable. */ }
    });
  }
  systemTheme.addEventListener('change', (event) => {
    if (!explicitTheme) applyTheme(event.matches ? 'dark' : 'light');
  });

  const workflowTabs = byId('workflow-tabs');
  if (workflowTabs) {
    const tabs = [...workflowTabs.querySelectorAll('button[data-workflow]')];
    const selectWorkflow = (tab, focus = false) => {
      const workflow = workflows[tab.dataset.workflow];
      if (!workflow) return;
      tabs.forEach((item) => {
        const selected = item === tab;
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
      });
      setText('demo-title', workflow.title);
      setText('demo-prompt', workflow.prompt);
      setText('demo-agent-name', workflow.agent);
      setText('demo-agent-handle', workflow.handle);
      setText('demo-agent-initial', workflow.initial);
      const agentAvatar = byId('demo-agent-initial');
      if (agentAvatar) agentAvatar.className = `avatar ${tab.dataset.workflow === 'analysis' ? 'ice' : tab.dataset.workflow === 'writing' ? 'butter' : 'mint'}`;
      setText('demo-response', workflow.response);
      setText('demo-file-name', workflow.file);
      workflow.steps.forEach((step, index) => setText(`demo-step-${index + 1}`, step));
      setText('demo-caption', workflow.caption);
      const exampleNumber = document.querySelector('.showcase-caption > span:last-child');
      if (exampleNumber) exampleNumber.textContent = `ILLUSTRATIVE WORKFLOW / ${String(tabs.indexOf(tab) + 1).padStart(2, '0')}`;
      const panel = byId(tab.getAttribute('aria-controls'));
      if (panel) {
        panel.dataset.workflow = tab.dataset.workflow;
        if (tab.id) panel.setAttribute('aria-labelledby', tab.id);
      }
      if (focus) tab.focus();
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectWorkflow(tab));
      tab.addEventListener('keydown', (event) => {
        let nextIndex;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = tabs.length - 1;
        if (nextIndex !== undefined) {
          event.preventDefault();
          selectWorkflow(tabs[nextIndex], true);
        }
      });
    });
    const initialTab = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || tabs[0];
    if (initialTab) selectWorkflow(initialTab);
  }

  const demoDialog = byId('demo-dialog');
  const demoForm = byId('demo-form');
  const demoFeedback = byId('demo-feedback');
  let demoTrigger;
  if (demoDialog && demoForm) {
    const openDemo = (trigger) => {
      demoTrigger = trigger;
      demoForm.reset();
      if (demoFeedback) {
        demoFeedback.textContent = '';
        demoFeedback.hidden = true;
      }
      setMenuOpen(false);
      if (!demoDialog.open) demoDialog.showModal();
      root.classList.add('dialog-open');
      demoForm.querySelector('input[name="name"]')?.focus();
    };
    document.querySelectorAll('[data-demo]').forEach((trigger) => {
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        openDemo(trigger);
      });
    });
    byId('demo-close')?.addEventListener('click', () => demoDialog.close());
    demoDialog.addEventListener('click', (event) => {
      if (event.target !== demoDialog) return;
      const bounds = demoDialog.getBoundingClientRect();
      const outside = event.clientX < bounds.left || event.clientX > bounds.right
        || event.clientY < bounds.top || event.clientY > bounds.bottom;
      if (outside) demoDialog.close();
    });
    demoDialog.addEventListener('close', () => {
      root.classList.remove('dialog-open');
      demoTrigger?.focus();
    });
    demoForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!demoForm.reportValidity()) return;
      const formData = new FormData(demoForm);
      const field = (name) => String(formData.get(name) || '').trim();
      const subject = `truex demo request${field('company') ? ` — ${field('company')}` : ''}`;
      const body = [
        'Hi Ashok,',
        '',
        'I would like to book a truex demo.',
        '',
        `Name: ${field('name')}`,
        `Email: ${field('email')}`,
        `Company: ${field('company') || 'Not provided'}`,
        `What I would like to explore: ${field('interest') || 'An introduction to truex'}`,
        '',
        'Please let me know a suitable time.',
      ].join('\n');
      const mailto = `mailto:ashokjoe@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      if (demoFeedback) {
        demoFeedback.hidden = false;
        demoFeedback.textContent = 'Your email draft is ready. Send it in your email app to complete your request.';
        const fallback = document.createElement('a');
        fallback.href = mailto;
        fallback.textContent = 'Open the email draft again';
        fallback.className = 'email-draft-link';
        demoFeedback.append(document.createElement('br'), fallback);
      }
      window.location.href = mailto;
    });
  }

  const revealElements = document.querySelectorAll('[data-reveal]');
  setText('copyright-year', new Date().getFullYear());
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    revealElements.forEach((element) => observer.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add('is-visible'));
  }
})();
