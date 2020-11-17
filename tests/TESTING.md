# Testing on a local testchain

(More information will come, below is just placeholder)

## e2e testing
Set up
```
cd auction-demo-keeper
git submodule update --init --recursive
```

To run the testchain, execute `./run-testchain`.
In another shell, call `./run-tests`.

```
MCD_DOG 0x177dD44aa5a7A476d565D6500A2021d3414958d6
MCD_CLIP_ETH_A 0x9C478ee982B97E0E7938dad2Dbd79475aFbBA10E
MCD_ABACUS_ETH_A 0x942694fd91bdbF92697d94DF3ed0A893F003F3e9
OASIS_CALLEE 0x959F9b393914ebF4118CB3E565Ef2001CE94d0aE
```

To create a new snapshot of the testchain, execute `./build-testchain`.




