# Parser State Transition Diagram

```mermaid
stateDiagram-v2
  [*] --> ReadToken
  ReadToken --> MatchProduction: lookahead selects rule
  MatchProduction --> ReadToken: consume terminal / parse child
  ReadToken --> Accept: end marker and complete start symbol
  ReadToken --> Reject: token not accepted by current production
  Reject --> ReportLocation: preserve 1-based line and column
  Accept --> [*]
  ReportLocation --> [*]
```

For the arithmetic grammar, `E` calls `T`, `T` calls `F`, and the loops in `E′` and `T′` encode left-associative operators. MiniC profiles use the same recursive-descent approach but separate production sets.
