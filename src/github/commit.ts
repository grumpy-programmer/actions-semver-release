export interface Commit {
  sha: string;
  commit: CommitData;
}

interface CommitData {
  author: Author;
  message: string;
}

interface Author {
  date: string;
}
