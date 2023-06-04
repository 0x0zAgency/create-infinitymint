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
    let fetched = await fetch(base + "/archive/refs/heads/master.zip");
    let zip = new jszip();
    let data = await fetched.blob();
    let content = await zip.loadAsync(data);
    let files = content.files;
    //write files
    for (let file in files) {
      let dir = file.split(".")[0];
      if (!dir.endsWith("/")) dir = dir + dir.split("/").slice(-1)[0] + "/";
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, file), await files[file].async("string"));
    }
  }

  //clean our git stuff
  await runCommand("cd " + location + " && rm -rf .git");

  console.log(
    chalk.green(
      "Successfully fetched a new InfinityMint at " + chalk.underline(location)
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
  await runCommand("cd " + location + " && npm install");

  console.log(
    chalk.green(
      "Successfully created a new InfinityMint at " + chalk.underline(location)
    )
  );
  console.log(`please run cd ${location} && npx infinitymint`);
};

const createInfinityMintBoilerplate = async (
  location: string,
  language: "typescript" | "javascript"
) => {
  let url = "https://github.com/0x0zAgency/infinitymint";
  url = url + "-" + language + "-boilerplate";

  await getRepository(url, location);
  await runCommand("cd " + location + " && npm install");

  console.log(
    chalk.green(
      "Successfully created a new InfinityMint boilerplate at " +
        chalk.underline(location)
    )
  );
  console.log(`please run cd ${location} && npx infinitymint`);
};

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
