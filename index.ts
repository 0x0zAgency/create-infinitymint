import chalk from "chalk";
import {
  choice,
  confirm,
  cwd,
  errorAndClear,
  selectDirectory,
} from "./app/utils";

const createInfinityMintFramework = (
  location: string,
  famework: "react" | "svelte",
  language: "typescript" | "javsacript",
  bundler: string
) => {};

const createInfinityMintBoilerplate = (
  location: string,
  language: "typescript" | "javascript"
) => {};

const getLocation = async () => {
  console.log(
    chalk.underline.gray(
      "InfinityMint will now ask you to select a location to create your application."
    )
  );
  console.log(
    chalk.gray("Your current working directory is " + chalk.underline(cwd()))
  );

  let selectingDir = true;
  let location: string;
  while (selectingDir) {
    location = await selectDirectory();

    if (location === null) {
      selectingDir = false;
      break;
    }

    let useLocation = await confirm(
      "Are you sure you want to create a React InfinityMint at " +
        chalk.underline(location)
    );

    if (useLocation) selectingDir = false;
  }

  return location;
};

const menu = {
  react: {
    key: "React",
    onSelected: async () => {
      let choices = ["Webpack", "Vite", "Exit"];
      let choiceVal = await choice(
        "What bundler would you like to use?",
        choices
      );
      let bundler = choices[choiceVal];

      if (bundler === "Exit") return;

      choices = ["Typescript", "Javascript", "Exit"];
      choiceVal = await choice(
        "What programming language would you like to use?",
        choices
      );
      let language = choices[choiceVal];

      if (language === "Exit") return;

      console.log(
        chalk.magenta(
          `\nUsing ${bundler} and ${language} to create a React InfinityMint.`
        )
      );

      let location = await getLocation();
      if (!location) return;

      createInfinityMintFramework(
        location,
        "react",
        language.toLowerCase() as any,
        bundler.toLowerCase()
      );
    },
  },
  svelte: {
    key: "Svelte",
    onSelected: async () => {
      console.log("Unsupported");
    },
  },
  boilerplace: {
    key: "Boilerplate",
    onSelected: async () => {
      console.log(
        chalk.underline.gray(
          "Boilerplates are for people who want to create their own InfinityMint from scrath with no bundlers or frameworks."
        )
      );
      let choices = ["Typescript", "Javascript", "Exit"];
      let choiceVal = await choice(
        "What programming language would you like to use?",
        choices
      );

      let language = choices[choiceVal];

      if (language === "Exit") return;

      console.log(
        chalk.magenta(
          `\nUsing ${language} to create a InfinityMint boilerplate.`
        )
      );

      let location = await getLocation();
      if (!location) return;

      createInfinityMintBoilerplate(location, language.toLowerCase() as any);
    },
  },
  exit: {
    key: "Exit",
    onSelected: async () => {
      process.exit(0);
    },
  },
};

//makes an infinitymint.config.ts file
(async () => {
  console.clear();

  let menuFunc = async () => {
    console.log(chalk.cyanBright("\nCreate Infinitymint Utility"));
    console.log(
      chalk.underline.gray("This script will help you create an InfinityMint")
    );

    let menuVal = Object.values(menu);
    let menuOption = await choice(
      "What type of InfinityMint would you like to create?",
      menuVal.map((option) => option.key)
    );
    let selectedOption = menuVal[menuOption];

    if (!selectedOption) {
      await errorAndClear("Invalid Option");
    } else {
      await selectedOption.onSelected();
      await errorAndClear("");
    }
  };

  while (true) {
    await menuFunc();
  }
})();
