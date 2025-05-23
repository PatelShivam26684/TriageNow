<<<<<<< HEAD
TriageNow

TriageNow is an AI-powered medical triage web app. It allows users to input symptoms and see whether they should stay home, go to urgent care, or go to the ER — with a clear explanation and trusted sources.

This app is composed of:
- A **Flask backend** (`/backend`) that queries the Perplexity Sonar API
-  A **React frontend** (`/triagenow`) built with Tailwind and Create React App

---



Prerequisites
- Python 3.8+
- Node.js and npm
- API key for [Perplexity Sonar](https://www.perplexity.ai)

---
Create a folder for the app and cd into the folder:
```bash
cd folder
git clone https://github.com/PatelShivam26684/TriageNow.git
```

cd into TriageNow:
```bash
cd TriageNow
```



Backend Setup (`/backend`)

1. Open a terminal and navigate to the `backend` folder:

```bash
cd backend
```
2. (Optional but recommended) Create and activate a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate      # macOS/Linux
# venv\Scripts\activate       # Windows
```
3. Install required packages:

```bash
pip install -r requirements.txt
```
4. Create a .env file in the backend folder and add your Sonar API key:

SONAR_API_KEY=your_api_key_here


5. Start the Flask server:
```bash
python app.py
```
The backend will run at: http://127.0.0.1:5000

---

Frontend Setup (`/triagenow`)

1. In a separate terminal tab run:
```bash
cd triagenow
npm install
npm start
```

This will start the frontend at: http://localhost:3000

Make sure the backend is running at the same time.
=======
# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
>>>>>>> 6b7bce90d70894ab464e0dc19100ba9dd2891e8c
