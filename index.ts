import chalk from "chalk";
import {
  choice,
  confirm,
  cwd,
  errorAndClear,
  runCommand,
  selectDirectory,
} from "./app/utils";
import jszip from "jszip";
import fs from "fs";
import path from "path";

let packageManager;

const getRepository = async (base: string, location: string) => {
  let choices = ["Use Git", "Fetch", "Exit"];
  let choiceVal = await choice(
    "How would you like to get the repository?",
    choices
  );
  let selectedChoice = choices[choiceVal];

  if (selectedChoice === "Exit") return null;

  if (selectedChoice === "Use Git") {
    console.log(
      chalk.yellow("Cloning from " + base + " to " + location + " using git")
    );
    //clone repository
    try {
      await runCommand("git clone " + base + " " + location);
    } catch (error) {
      console.log(
        chalk.red(
          "Failed to clone repository. Please make sure you have git installed and that you have access to the repository. Please selected 'Fetch' "
        )
      );
      return await getRepository(base, location);
    }
  } else {
    console.log(
      chalk.yellow(
        "Fetching from " +
          (base + "/archive/refs/heads/master.zip") +
          " extracting to " +
          location
      )
    );
    let fetched = await fetch(base + "/archive/refs/heads/master.zip");
    let zip = new jszip();
    let data = await fetched.arrayBuffer();
    let content = await zip.loadAsync(data);
    let files = content.files;
    //write files
    for (let file in files) {
      //remove first folder
      let actualLocation = file.split("/").slice(1).join("/");

      if (path.join(location, actualLocation) === location) continue;

      if (
        file.endsWith("/") &&
        !fs.existsSync(path.join(location, actualLocation))
      ) {
        //if it is a directory
        fs.mkdirSync(path.join(location, actualLocation), {
          recursive: true,
        });
        continue;
      }

      //write the file
      fs.writeFileSync(
        path.join(location, actualLocation),
        await files[file].async("string")
      );
    }
  }

  //clean our git stuff
  await runCommand("cd " + location + " && rm -rf .git");

  console.log(
    chalk.green(
      "Successfully downloaded a new InfinityMint and extracted at " +
        chalk.underline(location)
    )
  );
};

const createInfinityMintFramework = async (
  location: string,
  famework: "react" | "svelte",
  language: "typescript" | "javsacript",
  bundler: string
) => {
  let url = "https://github.com/0x0zAgency/infinitymint";
  url = url + "-" + famework + "-" + language + "-starterkit";

  await getRepository(url, location);
  await runCommand("cd " + location + ` && ${packageManager} install`);
  await exitScreen(location);
};

const exitScreen = async (location) => {
  console.log(chalk.underline.green("\nWelcome to InfinityMint!"));
  console.log(
    `\nYou can now ${chalk.magenta(
      "start setting up your infinitymint"
    )} by running ${chalk.cyan(`
    cd ${location} && ${(() => {
      if (packageManager === "pnpm") return "pnpx";
      return packageManager === "yarn" ? "yarn dlx" : "npx";
    })()} infinitymint
    `)}`
  );
  console.log(
    chalk.gray(
      "Please check out our auto-generated documentation at " +
        chalk.underline("https://docs.infinitymint.app")
    )
  );
  console.log(
    chalk.gray(
      "You can also hand written tutorials at " +
        chalk.underline("https://guide.infinitymint.app")
    )
  );
};

const createInfinityMintBoilerplate = async (
  location: string,
  language: "typescript" | "javascript"
) => {
  let url = "https://github.com/0x0zAgency/infinitymint";
  url = url + "-" + language + "-boilerplate";

  await getRepository(url, location);
  await runCommand("cd " + location + ` && ${packageManager} install`);
  await exitScreen(location);
};

const getLocation = async () => {
  let selectingDir = true;
  let location: string;
  while (selectingDir) {
    console.log(
      chalk.underline.gray(
        "\nPlease select a directory to create your InfinityMint application in."
      )
    );
    console.log(
      chalk.gray(
        "Current selected directory:" + chalk.underline(location || cwd())
      )
    );
    location = await selectDirectory();

    if (location === null) {
      selectingDir = false;
      break;
    }

    if (location === undefined)
      return errorAndClear("Failed to select a directory");

    let useLocation = await confirm(
      "Are you sure you want to create a React InfinityMint at " +
        chalk.underline(location)
    );

    //check if location has any files
    let files = fs.readdirSync(location);

    if (files.length > 0) {
      console.log(
        chalk.red(
          "The directory you selected is not empty. Please select an empty directory."
        )
      );
      continue;
    }

    if (useLocation) selectingDir = false;
  }

  return location;
};

const menu = {
  react: {
    key: "React",
    onSelected: async () => {
      let choices = ["Webpack (default)", "Vite", "Exit"];
      let choiceVal = await choice(
        "What bundler would you like to use?",
        choices
      );
      let bundler = choices[choiceVal].split(" ")[0];

      if (bundler === "Exit") return;

      choices = ["Typescript (default)", "Javascript", "Exit"];
      choiceVal = await choice(
        "What programming language would you like to use?",
        choices
      );
      let language = choices[choiceVal].split(" ")[0];
      if (language === "Exit") return;

      console.log(
        chalk.magenta(
          `\nUsing ${bundler} and ${language} to create a React InfinityMint.`
        )
      );

      let location = await getLocation();
      if (!location) return;

      await createInfinityMintFramework(
        location,
        "react",
        language.toLowerCase() as any,
        bundler.toLowerCase()
      );
      process.exit(0);
    },
  },
  svelte: {
    key: "Svelte",
    onSelected: async () => {
      console.log(chalk.magenta(`\nCreating a Svelt InfinityMInt`));

      let location = await getLocation();
      if (!location) return;

      await createInfinityMintFramework(
        location,
        "svelte",
        "typescript",
        "vite"
      );
      process.exit(0);
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
      let choices = ["Typescript (default)", "Javascript", "Exit"];
      let choiceVal = await choice(
        "What programming language would you like to use?",
        choices
      );

      let language = choices[choiceVal].split(" ")[0];

      if (language === "Exit") return;

      console.log(
        chalk.magenta(
          `\nUsing ${language} to create a InfinityMint boilerplate.`
        )
      );

      let location = await getLocation();
      if (!location) return;

      await createInfinityMintBoilerplate(
        location,
        language.toLowerCase() as any
      );

      process.exit(0);
    },
  },
  exit: {
    key: "Exit",
    onSelected: async () => {
      await exitScreen("test");
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

    let choices = ["npm (default)", "pnpm", "yarn"];
    let choiceVal = await choice(
      "What package manager would you like to use? (if you don't know, use npm)",
      choices
    );
    packageManager = choices[choiceVal].split(" ")[0];

    console.log(
      chalk.magenta(
        `\nUsing ${packageManager} to create a InfinityMint application.`
      )
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
