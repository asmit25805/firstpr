import { Router } from 'express';
import { searchIssues, getIssue } from '../services/githubService';

export const issuesRouter = Router();

issuesRouter.get('/search', async (req, res, next) => {
  try {
    const { label, language, repo, org, unassignedOnly, sort, page, perPage } = req.query;
    const githubToken = req.header('x-github-token') || undefined;

    const result = await searchIssues({
      label: typeof label === 'string' ? label : undefined,
      language: typeof language === 'string' ? language : undefined,
      repo: typeof repo === 'string' ? repo : undefined,
      org: typeof org === 'string' ? org : undefined,
      unassignedOnly: unassignedOnly === 'true',
      sort: sort === 'created' || sort === 'comments' ? sort : 'updated',
      page: page ? Number(page) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
      githubToken,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

issuesRouter.get('/:owner/:repo/:number', async (req, res, next) => {
  try {
    const { owner, repo, number } = req.params;
    const githubToken = req.header('x-github-token') || undefined;
    const issue = await getIssue(owner, repo, number, githubToken);
    res.json(issue);
  } catch (err) {
    next(err);
  }
});
