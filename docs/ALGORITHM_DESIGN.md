# GreenLedger: Core Research Algorithms & Algorithmic Design Specification

**Authors:** GreenLedger Architecture & Research Team  
**Subject:** Demand-Aware Weighted Proportional Energy Allocation, Price-Aware Greedy Matching, and Rule-Based Dynamic Pricing in P2P Renewable Microgrids  
**Document Version:** 1.0.0 (Phase 7 Core Research Algorithms)  
**Target Publication Format:** IEEE Transactions on Smart Grid / Sustainable Energy Systems  

---

## 1. Executive Summary & Problem Formulation

In decentralized peer-to-peer (P2P) renewable energy microgrids, localized generation from solar photovoltaics (PV), wind turbines, and small hydro is stochastic, variable, and capacity-constrained. When aggregate localized demand exceeds available renewable generation ($\sum d_i > S$), microgrid operators must allocate energy among competing prosumers and critical municipal infrastructures.

Traditional allocation mechanisms exhibit severe systemic flaws:
1. **First-Come, First-Served (FCFS):** Prioritizes fast networking latency over societal utility, creating severe allocation inequality where late-arriving critical loads (e.g., intensive care units, emergency medical refrigeration) receive zero energy while early standard loads receive 100%.
2. **Unconstrained Market Auctions:** Wealthy commercial consumers bid up spot tariffs, pricing out vital public services and residential prosumers.
3. **Basic Uniform Proportional Allocation:** Treats all demand identically, failing to prioritize essential and life-safety loads during severe grid deficits.

**GreenLedger** introduces a tri-fold algorithmic architecture:
1. **Demand-Aware Weighted Proportional Allocation (DA-WPA):** A fair, multi-priority proportional distribution with hard demand caps and iterative residual surplus redistribution.
2. **Price-Aware Greedy Matching:** A double-auction merit-order engine pairing lowest-cost renewable asks with highest-value consumer bids.
3. **Rule-Based Dynamic Pricing:** A transparent, bounded pricing mechanism governed by supply-demand elasticity ratios ($R = D/S$) and Time-of-Use (TOU) schedules.

---

## 2. Mathematical Formulations

### 2.1 Demand-Aware Weighted Proportional Allocation (DA-WPA)

Let:
- $S \in \mathbb{R}^+$: Total available renewable generation capacity (kWh) in the clearing cycle.
- $N$: Set of active consumer demand requests, $|N| = n$.
- $d_i \in \mathbb{R}^+$: Energy quantity requested by consumer $i \in N$ (kWh).
- $w_i \in \mathbb{R}^+$: Priority weight assigned to consumer $i$ ($w_i \ge 1.0$).
  - **Critical Infrastructure (Tier 1):** $w_i = 2.0$ (Hospitals, emergency services, cold chain).
  - **Commercial Operations (Tier 2):** $w_i = 1.5$ (Data centers, public transit EV fleets).
  - **Standard Residential (Tier 3):** $w_i = 1.0$ (Residential prosumers, smart homes).
- $x_i \in \mathbb{R}^+$: Energy allocated to consumer $i$ (kWh).

#### Initial Proportional Share
The initial proportional allocation share is:
$$\hat{x}_i = S \times \frac{w_i \cdot d_i}{\sum_{j \in N} w_j \cdot d_j}$$

#### Demand Cap Constraint
No consumer may receive more energy than requested:
$$x_i^{(1)} = \min\left(d_i, \hat{x}_i\right)$$

#### Iterative Residual Surplus Redistribution
If a subset of consumers $M \subset N$ reach their demand cap ($x_m = d_m, \forall m \in M$), a residual surplus $S_{\text{res}}$ remains:
$$S_{\text{res}} = S - \sum_{i \in N} x_i$$

If $S_{\text{res}} > 0$ and the unsatisfied set $U = \{i \in N \mid x_i < d_i\} \neq \emptyset$, the surplus is iteratively redistributed among $U$:
$$\Delta x_i = \min\left(d_i - x_i, S_{\text{res}} \times \frac{w_i \cdot (d_i - x_i)}{\sum_{k \in U} w_k \cdot (d_k - x_k)}\right)$$
$$x_i \leftarrow x_i + \Delta x_i$$

This process repeats until $S_{\text{res}} < \epsilon$ (where $\epsilon = 10^{-4}\text{ kWh}$) or $U = \emptyset$.

#### Guarantees & Invariants
$$\forall i \in N, \quad 0 \le x_i \le d_i$$
$$\sum_{i \in N} x_i \le S$$

---

### 2.2 Price-Aware Greedy Merit-Order Matching

Let $A = \{a_1, a_2, \dots, a_m\}$ be the set of active producer listings (asks), where ask $a_j = \langle q_j^{\text{avail}}, p_j^{\text{ask}}, t_j^a, j \rangle$.  
Let $B = \{b_1, b_2, \dots, b_n\}$ be the set of active consumer requests (bids), where bid $b_i = \langle q_i^{\text{req}}, p_i^{\text{max}}, w_i, t_i^b, i \rangle$.

1. **Sort Asks Ascending by Price:**
   $$a_j \prec a_k \iff \left(p_j^{\text{ask}} < p_k^{\text{ask}}\right) \lor \left(p_j^{\text{ask}} = p_k^{\text{ask}} \land t_j^a < t_k^a\right) \lor \left(p_j^{\text{ask}} = p_k^{\text{ask}} \land t_j^a = t_k^a \land j < k\right)$$
2. **Sort Bids Descending by Max Price & Priority:**
   $$b_i \prec b_l \iff \left(p_i^{\text{max}} > p_l^{\text{max}}\right) \lor \left(p_i^{\text{max}} = p_l^{\text{max}} \land w_i > w_l\right) \lor \left(\dots \land t_i^b < t_l^b\right)$$
3. **Price Compatibility Check:**
   A match between ask $a_j$ and bid $b_i$ is feasible if and only if:
   $$p_i^{\text{max}} \ge p_j^{\text{ask}}$$
4. **Clearing Price Determination:**
   $$p_{\text{clear}} = \frac{p_j^{\text{ask}} + p_i^{\text{max}}}{2} \quad (\text{Midpoint Mechanism})$$
5. **Matched Volume:**
   $$\Delta q = \min\left(q_j^{\text{avail}}, q_i^{\text{req}}\right)$$

---

### 2.3 Rule-Based Dynamic Pricing

Calculates the microgrid supply-demand elasticity ratio $R$:
$$R = \frac{D_{\text{total}}}{S_{\text{total}}} = \frac{\sum_{i=1}^n d_i}{\sum_{j=1}^m q_j}$$

The dynamic tariff $P_{\text{dynamic}}$ is defined by:
$$P_{\text{dynamic}} = \min\left(P_{\max}, \max\left(P_{\min}, P_{\text{ref}} \cdot (1 + \delta(R)) \cdot \mu_{\text{TOU}} \cdot \mu_{\text{source}}\right)\right)$$

Where:
- $P_{\text{ref}} = 0.00010000\text{ ETH/kWh}$ (Configurable base tariff).
- $\delta(R)$ is the piece-wise demand-elasticity adjustment function:
  $$\delta(R) = \begin{cases} -0.10 & \text{if } R < 0.50 \quad (\text{Surplus generation discount}) \\ 0.00 & \text{if } 0.50 \le R \le 1.00 \quad (\text{Equilibrium balanced price}) \\ +0.10 & \text{if } R > 1.00 \quad (\text{Scarcity congestion adjustment}) \end{cases}$$
- $\mu_{\text{TOU}}$ is the deterministic Time-of-Use tariff multiplier:
  $$\mu_{\text{TOU}} = \begin{cases} 1.25 & \text{if hour } \in [18, 22] \quad (\text{Evening Peak}) \\ 1.10 & \text{if hour } \in [09, 12] \quad (\text{Midday Commercial Peak}) \\ 0.85 & \text{if hour } \in [01, 05] \quad (\text{Nocturnal Off-Peak Trough}) \\ 1.00 & \text{otherwise} \end{cases}$$
- $\mu_{\text{source}}$ is the resource availability multiplier (e.g., $0.95$ for solar during peak irradiance 11:00-15:00).
- $[P_{\min}, P_{\max}] = [0.00005000, 0.00020000]\text{ ETH/kWh}$ (Regulatory safety clamps preventing price shocks).

---

## 3. Fairness & Performance Metrics

### 3.1 Jain's Fairness Index
Formulated by Raj Jain (1984), measuring the uniformity of allocation:
$$J(x) = \frac{\left(\sum_{i=1}^n x_i\right)^2}{n \cdot \sum_{i=1}^n x_i^2}$$

In GreenLedger, we compute Jain's Index both on raw allocation volumes $x_i$ and on individual fulfillment ratios $F_i = x_i / d_i$:
$$J(F) = \frac{\left(\sum_{i=1}^n \frac{x_i}{d_i}\right)^2}{n \cdot \sum_{i=1}^n \left(\frac{x_i}{d_i}\right)^2}$$
- $J = 1.0$: Perfectly fair and balanced fulfillment.
- $J = 1/n$: Total monopoly/starvation where one consumer captures 100% and all others receive 0%.

### 3.2 Overall Fulfillment Ratio
$$F = \frac{\sum_{i=1}^n x_i}{\sum_{i=1}^n d_i}$$

### 3.3 Allocation Efficiency
$$E = \frac{\sum_{i=1}^n x_i}{S} \times 100\%$$

### 3.4 Unmet Demand Deficit
$$U = \sum_{i=1}^n (d_i - x_i)$$

---

## 4. Worked Numerical Example

### Scenario Setup
- Total Available Solar Energy $S = 200\text{ kWh}$.
- Three active consumers:
  - Consumer 1 (Hospital ICU): $d_1 = 80\text{ kWh}, \quad w_1 = 2.0$.
  - Consumer 2 (Commercial Data Center): $d_2 = 120\text{ kWh}, \quad w_2 = 1.5$.
  - Consumer 3 (Residential Prosumer): $d_3 = 60\text{ kWh}, \quad w_3 = 1.0$.
- Total Aggregate Demand: $D = 80 + 120 + 60 = 260\text{ kWh} > S$ (Scarcity condition, deficit of $60\text{ kWh}$).

### Step 1: Weighted Demand Calculation
$$\text{Weighted Demand}_1 = 80 \times 2.0 = 160$$
$$\text{Weighted Demand}_2 = 120 \times 1.5 = 180$$
$$\text{Weighted Demand}_3 = 60 \times 1.0 = 60$$
$$\sum_{j=1}^3 w_j d_j = 160 + 180 + 60 = 400$$

### Step 2: Initial Proportional Allocation
$$\hat{x}_1 = 200 \times \frac{160}{400} = 80.0\text{ kWh}$$
$$\hat{x}_2 = 200 \times \frac{180}{400} = 90.0\text{ kWh}$$
$$\hat{x}_3 = 200 \times \frac{60}{400} = 30.0\text{ kWh}$$

### Step 3: Apply Demand Caps
- Consumer 1: $x_1 = \min(80, 80.0) = 80.0\text{ kWh}$ (Fulfillment: $100\%$).
- Consumer 2: $x_2 = \min(120, 90.0) = 90.0\text{ kWh}$ (Fulfillment: $75\%$).
- Consumer 3: $x_3 = \min(60, 30.0) = 30.0\text{ kWh}$ (Fulfillment: $50\%$).

Total Allocated: $80 + 90 + 30 = 200\text{ kWh} = S$. Residual Surplus: $S_{\text{res}} = 0\text{ kWh}$.

### Comparison against FCFS and Basic Proportional
1. **Under FCFS (Arrival order: Residential -> Data Center -> Hospital):**
   - Consumer 3 (Residential): Gets $60\text{ kWh}$ ($100\%$). Remaining $S = 140\text{ kWh}$.
   - Consumer 2 (Data Center): Gets $120\text{ kWh}$ ($100\%$). Remaining $S = 20\text{ kWh}$.
   - Consumer 1 (Hospital ICU): Gets $20\text{ kWh}$ (**only 25% fulfillment! Severe safety violation**).
   - Jain's Fairness Index $J(F) = \frac{(1.0 + 1.0 + 0.25)^2}{3 \times (1.0^2 + 1.0^2 + 0.25^2)} = \frac{5.0625}{3 \times 2.0625} \approx \mathbf{0.8182}$.

2. **Under Proposed DA-WPA:**
   - Consumer 1 (Hospital ICU): $80.0\text{ kWh}$ (**100% fulfillment, critical life-safety protected**).
   - Consumer 2 (Data Center): $90.0\text{ kWh}$ ($75\%$ fulfillment).
   - Consumer 3 (Residential): $30.0\text{ kWh}$ ($50\%$ fulfillment).
   - Jain's Fairness Index $J(F) = \frac{(1.0 + 0.75 + 0.50)^2}{3 \times (1.0^2 + 0.75^2 + 0.50^2)} = \frac{5.0625}{3 \times 1.8125} \approx \mathbf{0.9310}$.

**Conclusion:** The proposed DA-WPA algorithm achieves higher relative fairness ($0.9310$ vs $0.8182$) while guaranteeing 100% fulfillment for critical loads.

---

## 5. Computational Complexity Analysis

| Algorithm | Time Complexity | Space Complexity | Optimality & Convergence |
| :--- | :--- | :--- | :--- |
| **FCFS** | $\mathcal{O}(n \log n)$ (sorting) | $\mathcal{O}(n)$ | Greedy heuristic, ignores priority weights. |
| **Basic Proportional** | $\mathcal{O}(k \cdot n)$ ($k \le 10$ rounds) | $\mathcal{O}(n)$ | Monotonically converges in $\le n$ iterations. |
| **Proposed DA-WPA** | $\mathcal{O}(k \cdot n)$ ($k \le 10$ rounds) | $\mathcal{O}(n)$ | Monotonically converges; bounded by demand caps. |
| **Greedy Matching** | $\mathcal{O}(m \log m + n \log n)$ | $\mathcal{O}(m + n)$ | Globally optimal for merit-order clearing price. |
| **Dynamic Pricing** | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ | Constant time deterministic evaluation. |

---

## 6. Assumptions & Limitations

1. **Deterministic Input Assumption:** Telemetry inputs are treated as authenticated and calibrated smart meter readings.
2. **Discrete Clearing Windows:** Allocation executes in discrete batch windows (e.g., 5-minute or 15-minute market settlement periods).
3. **No Machine Learning:** The system relies strictly on deterministic closed-form rules to preserve regulatory compliance, auditability, and zero black-box drift.
4. **Physical Microgrid Invariant:** Physical line impedances and reactive power constraints are handled at the primary grid substation level; GreenLedger functions as the economic and commercial clearing layer.

---
*End of Specification.*
