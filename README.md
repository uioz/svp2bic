This cli tool is design for converting xtl to bcpf.

xtl -> for SolveigMMVideoSplitter
bcpf -> for Bandicut

# installation

For cli purpose(recommendation):

```
npm install svp2bic -g
```

For api purpose:

```
npm install svp2bit
```

# usage

Converting xtl to bcpf:

```
// using relative path
svp2bic ./test.xtl
// using absolute path
svp2bic /home/test.xtl
```

That will generate one or more bcpf files in current directory depends How many task in your xtl file.

For exmaple, there are three tasks in the `test.xtl` file, each output name is:

1. demo1.mp4
2. demp2.mkv
3. demp3.avi

After the above command is executed, the result is:

1. demo1.bcpf
2. demo2.bcpf
3. demo3.bcpf

Specifying output location:

```
svp2bic ./test.xtl /home
```

If the directory doesn't exist, svp2bit will create it automatically.

# api

```typescript
import { convert } from "svp2bic"

convert(
  "", // The xtl file's path
  "" // The output directory (optional)
  log=>console.log(log) // log function (optional)
).then(()=>{
  // convert success
}).catch((error)=>{
  // do something
})

```
