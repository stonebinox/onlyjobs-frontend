import { Salary } from "./Salary";

export type Job = {
  _id: string;
  title: string;
  company: string;
  location: string[];
  salary: Salary;
  tags: string[];
  source: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  postedDate: string;
  scrapedDate: string;
  url: string;
};
