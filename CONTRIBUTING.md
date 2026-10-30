# Issues and support

The issue tracker is for problems with INAV Blackbox Explorer itself, not for support with flying, tuning or
configuring INAV. For those, ask the community first:

* [INAV Discord Server](https://discord.gg/peg2hhbYwN)
* [INAV Official on Facebook](https://www.facebook.com/groups/INAVOfficial)
* [INAV Official on Telegram](https://t.me/INAVFlight)

Please search the existing issues before opening a new one, and attach the log that shows the problem: most problems
with the explorer can only be found with it.

# Developers

The [README](README.md#developing) explains how to build and run the explorer and where the INAV-specific code lives.

* Open pull requests against `master`, one fix or feature each.
* `npm run lint` must pass; the CI also builds the web application and the desktop packages.
* Say how the change was checked, and with which logs: an INAV log that shows the change, and for anything that touches
  decoding, that the values still match `blackbox_decode` from
  [blackbox-tools](https://github.com/iNavFlight/blackbox-tools).
* A change that needs a firmware change to be useful says which INAV pull request it depends on.
