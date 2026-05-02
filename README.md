# MAS-Health Explorer

A scoping review and classification platform for **LLM-based Multi-agent Systems in Healthcare** research. This application features thematic analysis, paper reviews, and classification of 76 research papers based on recent literature.

## Features

- **Thematic Classification**: Filter research by themes like Clinical Decision-making, Mental Health, Oncology, Pharmacology, and more.
- **Deep Dive Reviews**: Interactive modals provide executive summaries, key findings, and system architectures for each paper.
- **Search Functionality**: Real-time search across titles, abstracts, and authors.
- **Responsive Design**: Polished, modern UI built with Tailwind CSS v4 and Framer Motion.

## Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Local Development

To run this project on your local machine, follow these steps:

### Prerequisites

- [Node.js](https://nodejs.org/) (Version 18 or higher recommended)
- [npm](https://www.npmjs.com/)

### Setup Instructions

1. **Clone or Download the Project**
   If you have the project as a ZIP, extract it. If it's a repository, clone it.

2. **Install Dependencies**
   Navigate to the project root and run:
   ```bash
   npm install
   ```

3. **Start the Development Server**
   Run the following command to start the local server:
   ```bash
   npm run dev
   ```

4. **View the Application**
   Once the server starts, open your browser and navigate to:
   `http://localhost:3000` (Note: In this specific environment, the port is fixed at 3000).

## Project Structure

- `src/App.tsx`: Main application logic and UI.
- `src/data.ts`: Entry point for research data.
- `src/data_part1.ts` & `src/data_part2.ts`: Contains the dataset of research papers.
- `src/types.ts`: TypeScript interfaces for the paper data model.
- `src/index.css`: Global styles and Tailwind configuration.

## Classification Methodology

Papers are classified into themes based on their full-text content:
- **Clinical Decision-making**: Focuses on diagnosis and treatment choices.
- **Mental Health**: Applications in psychotherapy and psychiatric assessment.
- **Oncology**: Specialized systems for cancer pain and tumor boards.
- **MAS versus Single LLM**: Studies that benchmark multi-agent gains over monolithic models.
- **Role-playing Agents**: Architectural patterns mimicking clinical multidisciplinary teams.
