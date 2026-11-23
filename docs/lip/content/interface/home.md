# Home

The Home page is where lip starts. After this page you can read what it says about your folder, use its steps to get a server running, and answer the question that lip asks when it cannot reach GitHub.

If the keys or the parts of the screen are new to you, read [A tour of the interface](./tour.md) first.

## The overview

The upper part of the page says what the workspace, the folder that lip works on, holds now.

![The Home page of a folder with a server and no mods. Numbers mark the overview, a finished step, the highlighted step and the sentence below the steps.](/screenshots/en/home-03-server-created.svg)

1. The overview. Its rows are explained in the table below.
2. A step with `✓` is done.
3. The highlighted step is the next one to take.
4. One sentence says what `Enter` does on the highlighted step.

| Row | Shows |
| --- | --- |
| Workspace | The folder. A long path is cut at its start, so that its end stays visible. |
| Game | The version of the Minecraft server in the folder, or "Not installed". |
| Loader | LeviLamina and its version, or "None". Mods need the loader. |
| Mods | How many mods you installed. Mods that were installed only because another mod needs them are not counted, and neither are the game and the loader. |
| Server | "Stopped", or `●` and "Running". From Start until the program of the server runs it says "Starting". Right after you ask the server to stop it says "Stopping", and while lip waits to start a crashed server again it says "Restarting". |

For a moment after the page opens, the rows show `…` while lip reads the folder.

## Next steps

Below the overview, under **Next steps**, are the four steps from a folder to a running server. lip highlights the first step that is not done, so in most cases you only press `Enter`.

Move between the steps with `↑` and `↓`. Press `Enter` to open the highlighted one.

| Step | It is done when | `Enter` |
| --- | --- | --- |
| 1 Choose a workspace | Always: a workspace is always selected. | Opens the [workspace picker](./workspaces.md), to pick or add another folder. |
| 2 Set up the server | The folder has the game. | Opens the [Server](./server.md) page and starts [setting up the server](./server.md#set-up-the-server). |
| 3 Install mods | You installed at least one mod. | Opens the [Marketplace](./get_mods.md) page. |
| 4 Start the server | The server runs. | Opens the [Server](./server.md) page and starts the server. |

### Nothing set up yet

In a folder without a server, only step 1 is ticked, and step 2 is highlighted.

![The Home page of an empty folder. Only "Choose a workspace" is ticked, and "Set up the server" is highlighted. The sentence below says "Pick a game version and a loader for this workspace."](/screenshots/en/home-01-empty.svg)

1. The page that is shown. The sidebar at its left lists every page.
2. The next step: `Enter` starts it.
3. The keys that work now.

Press `Enter` to set up the server in this folder. [Your first server](https://levimc.org/tutorials/server/first-server/) walks through what follows. If the server should go into another folder, choose that folder first with step 1.

### The server is set up

Once the folder has the game, steps 1 and 2 are ticked and step 3 is highlighted. This is the picture at the top of this page. Press `Enter` to browse the mods of levimc.org.

Step 3 is optional. A server without mods runs too: press `↓` and `Enter` to start it right away.

### Mods are installed

With at least one mod installed, steps 1 to 3 are ticked and step 4 is highlighted.

![The Home page of a server with four mods. Steps 1 to 3 are ticked, and "Start the server" is highlighted.](/screenshots/en/home-04-mods-installed.svg)

Press `Enter`. lip opens the Server page and starts the server.

### The server runs

While the server runs, all four steps are ticked. The top line and the overview both say "Running".

![The Home page while the server runs. All four steps are ticked, and the top line says "Running".](/screenshots/en/home-02-all-done.svg)

`Enter` on step 4 now opens the Server page without starting anything; the sentence below the steps says **Running. Enter opens its console.**

### A finished step can be opened again

A tick does not lock a step. `Enter` on step 1 always opens the workspace picker, and `Enter` on step 3 always opens the Marketplace, where you can install more. `Enter` on a ticked step 2 starts the setup again, to change the game or the loader version of the server.

![Step 2 is ticked and highlighted. The sentence below says "Done. Enter changes the game or loader version."](/screenshots/en/home-05-step-done.svg)

### Starting without a server

In a folder without a server there is nothing to start. If you press `Enter` on step 4 there, lip says "Set up the server first." at the right of the bottom line and moves the highlight back to step 2.

![The Home page of an empty folder after Enter on step 4. The bottom line says "Set up the server first.", and step 2 is highlighted again.](/screenshots/en/home-06-need-server.svg)

1. The message. It goes away after a few seconds.
2. The highlight is back on the step that sets up the server.

## When GitHub cannot be reached

lip downloads LeviLamina and most mods from GitHub. Each time the interface starts, lip checks in the background whether it reaches GitHub. It waits up to 10 seconds for an answer, and you can use the interface meanwhile.

When the check fails, lip asks how it should reach GitHub. It asks only once nothing else is open, so the question never interrupts a dialog.

![The dialog "GitHub unreachable". It says why the connection failed, asks "How should lip reach GitHub?", and offers Use a proxy, Connect directly and Later.](/screenshots/en/home-07-github.svg)

1. Why lip did not reach GitHub.
2. The three answers. The first one is highlighted.
3. One sentence about the highlighted answer.

Choose with `↑` and `↓`, and press `Enter`. Nothing is changed until you answer.

::: info
The check is not made at all once you have set a GitHub proxy, or chosen to connect directly, on the [Settings](./settings.md) page.
:::

### Use a proxy

Choose this when GitHub is slow or blocked where you are, and you know the address of a GitHub proxy. lip does not suggest one.

lip opens the [Settings](./settings.md) page and asks for the address.

![The Settings page with the dialog "GitHub proxy", whose field "Proxy URL" holds an address typed by the user.](/screenshots/en/home-11-github-proxy.svg)

Type the address and press `Enter`. lip tests the proxy first and saves it when it works. When it does not, you can enter another address, or keep this one anyway. The Settings page describes this in full.

`Esc` in this dialog saves nothing. lip asks again the next time it starts.

### Connect directly

Choose this when your connection to GitHub usually works, and the check failed for another reason, such as a network that was down for a moment.

![The answer "Connect directly" is highlighted. The sentence below says "Keep connecting directly, and do not ask again."](/screenshots/en/home-08-github-direct.svg)

lip saves that it connects directly, and says so in the bottom line. It does not check or ask again.

![The Home page. At the right of the bottom line is the message "Direct connection saved."](/screenshots/en/home-10-github-direct-saved.svg)

To change this later, set or remove the GitHub proxy on the [Settings](./settings.md) page.

### Later

Choose this when you do not want to decide now. `Esc` does the same.

![The answer "Later" is highlighted. The sentence below says "Change nothing, and ask again next time."](/screenshots/en/home-09-github-later.svg)

lip changes nothing. It checks again the next time the interface starts, and asks again if the check fails again.

::: warning
Until GitHub can be reached, setting up a server with LeviLamina and installing most mods fail. The failure dialog then says that lip could not reach the server. See [Troubleshooting](../guides/troubleshooting.md).
:::
